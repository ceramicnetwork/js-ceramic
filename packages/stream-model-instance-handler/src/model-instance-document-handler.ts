import jsonpatch from 'fast-json-patch'
import cloneDeep from 'lodash.clonedeep'
import { ModelInstanceDocument } from '@ceramicnetwork/stream-model-instance'
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
import { SchemaValidation } from './schema-utils.js'
import { Model } from '@ceramicnetwork/stream-model'

/**
 * ModelInstanceDocument stream handler implementation
 */
export class ModelInstanceDocumentHandler implements StreamHandler<ModelInstanceDocument> {
  private readonly _schemaValidator: SchemaValidation

  constructor() {
    this._schemaValidator = new SchemaValidation()
  }

  get type(): number {
    return ModelInstanceDocument.STREAM_TYPE_ID
  }

  get name(): string {
    return ModelInstanceDocument.STREAM_TYPE_NAME
  }

  get stream_constructor(): StreamConstructor<ModelInstanceDocument> {
    return ModelInstanceDocument
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
    if (!isSigned) {
      throw Error('ModelInstanceDocument genesis commit must be signed')
    }

    const streamId = await StreamID.fromGenesis('MID', commitData.commit)
    const { controllers, model } = payload.header
    const controller = controllers[0]
    const modelStreamID = StreamID.fromBytes(model)
    await SignatureUtils.verifyCommitSignature(
      commitData,
      context.did,
      controller,
      modelStreamID,
      streamId
    )

    if (!(payload.header.controllers && payload.header.controllers.length === 1)) {
      throw new Error('Exactly one controller must be specified')
    }

    const metadata = { controller, model: modelStreamID }
    const state = {
      type: ModelInstanceDocument.STREAM_TYPE_ID,
      content: payload.data || {},
      metadata,
      signature: SignatureStatus.SIGNED,
      anchorStatus: AnchorStatus.NOT_REQUESTED,
      log: [{ cid: commitData.cid, type: CommitType.GENESIS }],
    }

    await this._validateContent(context, state.metadata.model, state.content)

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
    const metadata = state.metadata
    const controller = metadata.controller
    const model = metadata.model

    // Verify the signature first
    const streamId = StreamUtils.streamIdFromState(state)
    await SignatureUtils.verifyCommitSignature(commitData, context.did, controller, model, streamId)

    // Retrieve the payload
    const payload = commitData.commit

    if (!payload.id.equals(state.log[0].cid)) {
      throw new Error(
        `Invalid genesis CID in commit. Found: ${payload.id}, expected ${state.log[0].cid}`
      )
    }
    const expectedPrev = state.log[state.log.length - 1].cid
    if (!payload.prev.equals(expectedPrev)) {
      throw new Error(
        `Commit doesn't properly point to previous commit in log. Expected ${expectedPrev}, found 'prev' ${payload.prev}`
      )
    }

    if (payload.header) {
      throw new Error(
        `Updating metadata for ModelInstanceDocument Streams is not allowed.  Tried to change metadata for Stream ${streamId} from ${JSON.stringify(
          state.metadata
        )} to ${JSON.stringify(payload.header)}\``
      )
    }

    const nextState = cloneDeep(state)

    nextState.signature = SignatureStatus.SIGNED
    nextState.anchorStatus = AnchorStatus.NOT_REQUESTED

    nextState.log.push({ cid: commitData.cid, type: CommitType.SIGNED })

    const oldContent = state.next?.content ?? state.content
    const newContent = jsonpatch.applyPatch(oldContent, payload.data).newDocument

    nextState.next = {
      content: newContent,
      metadata, // No way to update metadata for ModelInstanceDocument streams
    }

    await this._validateContent(context, metadata.model, newContent)

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
    const expectedPrev = state.log[state.log.length - 1].cid
    if (!commitData.commit.prev.equals(expectedPrev)) {
      throw new Error(
        `Commit doesn't properly point to previous commit in log. Expected ${expectedPrev}, found 'prev' ${commitData.commit.prev}`
      )
    }

    const proof = commitData.proof
    state.log.push({
      cid: commitData.cid,
      type: CommitType.ANCHOR,
      timestamp: proof.blockTimestamp,
    })
    let content = state.content

    if (state.next?.content) {
      content = state.next.content
    }

    delete state.next
    delete state.anchorScheduledFor

    return {
      ...state,
      content,
      anchorStatus: AnchorStatus.ANCHORED,
      anchorProof: proof,
    }
  }

  /**
   * Validates content against the schema of the model stream with given stream id
   * @param context - Ceramic context
   * @param modelStreamId - model stream's id
   * @param content - content to validate
   * @private
   */
  async _validateContent(context: Context, modelStreamId: StreamID, content: any): Promise<void> {
    const model = await context.api.loadStream<Model>(modelStreamId)
    await this._schemaValidator.validateSchema(content, model.content.schema)
  }
}
