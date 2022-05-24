import jsonpatch from 'fast-json-patch'
import cloneDeep from 'lodash.clonedeep'
import { Model, ModelDefinition } from '@ceramicnetwork/stream-model'
import {
  AnchorStatus,
  CommitData,
  CommitType,
  Context,
  SignatureStatus,
  SignatureUtils,
  StreamConstructor,
  StreamHandler,
  StreamState,
  StreamUtils,
} from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'

function stringArraysEqual(arr1: Array<string>, arr2: Array<string>) {
  if (arr1.length != arr2.length) {
    return false
  }
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false
    }
  }
  return true
}

/**
 * Model stream handler implementation
 */
export class ModelHandler implements StreamHandler<Model> {
  get type(): number {
    return Model.STREAM_TYPE_ID
  }

  get name(): string {
    return Model.STREAM_TYPE_NAME
  }

  get stream_constructor(): StreamConstructor<Model> {
    return Model
  }

  /**
   * Applies commit (genesis|signed|anchor)
   * @param commitData - Commit (with JWS envelope or anchor proof, if available and extracted before application)
   * @param context - Ceramic context
   * @param state - Document state
   */
  async applyCommit(
    commitData: CommitData,
    context: Context,
    state?: StreamState
  ): Promise<StreamState> {
    if (state == null) {
      // apply genesis
      return this._applyGenesis(commitData, context)
    }

    if (StreamUtils.isAnchorCommitData(commitData)) {
      return this._applyAnchor(context, commitData, state)
    }

    return this._applySigned(commitData, state, context)
  }

  /**
   * Applies genesis commit
   * @param commitData - Genesis commit
   * @param context - Ceramic context
   * @private
   */
  async _applyGenesis(commitData: CommitData, context: Context): Promise<StreamState> {
    const payload = commitData.commit
    const isSigned = StreamUtils.isSignedCommitData(commitData)
    if (isSigned) {
      const streamId = await StreamID.fromGenesis('model', commitData.commit)
      // TODO(NET-1437): replace family with model
      const { controllers, family } = payload.header
      await SignatureUtils.verifyCommitSignature(
        commitData,
        context.did,
        controllers[0],
        family,
        streamId
      )
    } else {
      throw Error('Model genesis commit must be signed')
    }

    if (!(payload.header.controllers && payload.header.controllers.length === 1)) {
      throw new Error('Exactly one controller must be specified')
    }

    const state = {
      type: Model.STREAM_TYPE_ID,
      content: payload.data || {},
      metadata: payload.header,
      signature: isSigned ? SignatureStatus.SIGNED : SignatureStatus.GENESIS,
      anchorStatus: AnchorStatus.NOT_REQUESTED,
      log: [{ cid: commitData.cid, type: CommitType.GENESIS }],
    }

    return state
  }

  /**
   * Applies signed commit
   * @param commitData - Signed commit
   * @param state - Document state
   * @param context - Ceramic context
   * @private
   */
  async _applySigned(
    commitData: CommitData,
    state: StreamState,
    context: Context
  ): Promise<StreamState> {
    // TODO: Assert that the 'prev' of the commit being applied is the end of the log in 'state'
    const metadata = state.next?.metadata ?? state.metadata
    const controller = metadata.controllers[0] // TODO(NET-1464): Use `controller` instead of `controllers`
    const family = metadata.family

    // Verify the signature first
    const streamId = StreamUtils.streamIdFromState(state)
    await SignatureUtils.verifyCommitSignature(
      commitData,
      context.did,
      controller,
      family,
      streamId
    )

    // Retrieve the payload
    const payload = commitData.commit

    if (!payload.id.equals(state.log[0].cid)) {
      throw new Error(`Invalid streamId ${payload.id}, expected ${state.log[0].cid}`)
    }

    if (payload.header.controllers) {
      throw new Error(
        `Updating controllers for Model Streams is not allowed.  Tried to change controllers for Stream ${streamId} from ${JSON.stringify(
          state.metadata.controllers
        )} to ${payload.header.controllers}\``
      )
    }

    const nextState = cloneDeep(state)

    nextState.signature = SignatureStatus.SIGNED
    nextState.anchorStatus = AnchorStatus.NOT_REQUESTED

    nextState.log.push({ cid: commitData.cid, type: CommitType.SIGNED })

    const oldContent: ModelDefinition = state.next?.content ?? state.content
    const newContent: ModelDefinition = jsonpatch.applyPatch(oldContent, payload.data).newDocument

    // Cannot update a finalized Model
    if (oldContent.name && oldContent.schema && oldContent.accountRelation) {
      throw new Error('Cannot update a finalized Model')
    }
    // Cannot update a placeholder Model other than to finalize it.
    Model.assertComplete(newContent, streamId)

    nextState.next = {
      content: newContent,
      metadata, // No way to update metadata for Model streams
    }

    return nextState
  }

  /**
   * Applies anchor commit
   * @param context - Ceramic context
   * @param commitData - Anchor commit
   * @param state - Document state
   * @private
   */
  async _applyAnchor(
    context: Context,
    commitData: CommitData,
    state: StreamState
  ): Promise<StreamState> {
    // TODO: Assert that the 'prev' of the commit being applied is the end of the log in 'state'
    const proof = commitData.proof
    state.log.push({
      cid: commitData.cid,
      type: CommitType.ANCHOR,
      timestamp: proof.blockTimestamp,
    })
    let content = state.content
    let metadata = state.metadata

    if (state.next?.content) {
      content = state.next.content
      delete state.next.content
    }

    if (state.next?.metadata) {
      metadata = state.next.metadata
      delete state.next.metadata
    }

    delete state.next
    delete state.anchorScheduledFor

    return {
      ...state,
      content,
      metadata,
      anchorStatus: AnchorStatus.ANCHORED,
      anchorProof: proof,
    }
  }
}
