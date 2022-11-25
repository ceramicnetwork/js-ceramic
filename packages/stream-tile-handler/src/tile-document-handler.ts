import jsonpatch from 'fast-json-patch'
import cloneDeep from 'lodash.clonedeep'
import { applyAnchorCommit } from '@ceramicnetwork/stream-handler-common'
import { TileDocument } from '@ceramicnetwork/stream-tile'
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
 * TileDocument stream handler implementation
 */
export class TileDocumentHandler implements StreamHandler<TileDocument> {
  private readonly _schemaValidator: SchemaValidation

  constructor() {
    this._schemaValidator = new SchemaValidation()
  }

  get type(): number {
    return TileDocument.STREAM_TYPE_ID
  }

  get name(): string {
    return TileDocument.STREAM_TYPE_NAME
  }

  get stream_constructor(): StreamConstructor<TileDocument> {
    return TileDocument
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
      return this._applyAnchor(commitData, state)
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
    const did = context.did
    if (!did) throw new Error(`DID is not set`)
    const payload = commitData.commit
    const isSigned = StreamUtils.isSignedCommitData(commitData)
    if (isSigned) {
      const streamId = await StreamID.fromGenesis('tile', commitData.commit)
      const { controllers } = payload.header
      await SignatureUtils.verifyCommitSignature(commitData, did, controllers[0], null, streamId)
    } else if (payload.data) {
      throw Error('Genesis commit with contents should always be signed')
    }

    if (!(payload.header.controllers && payload.header.controllers.length === 1)) {
      throw new Error('Exactly one controller must be specified')
    }

    const state: StreamState = {
      type: TileDocument.STREAM_TYPE_ID,
      content: payload.data || {},
      metadata: payload.header,
      signature: isSigned ? SignatureStatus.SIGNED : SignatureStatus.GENESIS,
      anchorStatus: AnchorStatus.NOT_REQUESTED,
      log: [StreamUtils.commitDataToLogEntry(commitData, CommitType.GENESIS)],
    }

    if (state.metadata.schema) {
      await this._schemaValidator.validateSchema(context.api, state.content, state.metadata.schema)
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
    const did = context.did
    if (!did) throw new Error(`DID is not set`)
    // Retrieve the payload
    const payload = commitData.commit
    StreamUtils.assertCommitLinksToState(state, payload)

    // Verify the signature
    const controller = state.next?.metadata?.controllers?.[0] || state.metadata.controllers[0]
    if (!controller) throw new Error(`Controller is not set`)
    const streamId = StreamUtils.streamIdFromState(state)
    await SignatureUtils.verifyCommitSignature(commitData, did, controller, null, streamId)

    if (payload.header.controllers) {
      if (payload.header.controllers.length !== 1) {
        throw new Error('Exactly one controller must be specified')
      }
      if (!payload.header.controllers[0]) {
        throw new Error('Controller cannot be updated to an undefined value.')
      }
    }

    if (
      state.metadata.forbidControllerChange &&
      payload.header.controllers &&
      !stringArraysEqual(payload.header.controllers, state.metadata.controllers)
    ) {
      const genesisLogEntry = state.log[0]
      const streamId = new StreamID(TileDocument.STREAM_TYPE_ID, genesisLogEntry.cid)
      throw new Error(
        `Cannot change controllers since 'forbidControllerChange' is set. Tried to change controllers for Stream ${streamId} from ${JSON.stringify(
          state.metadata.controllers
        )} to ${payload.header.controllers}`
      )
    }

    if (
      payload.header.forbidControllerChange !== undefined &&
      payload.header.forbidControllerChange !== state.metadata.forbidControllerChange
    ) {
      throw new Error("Changing 'forbidControllerChange' metadata property is not allowed")
    }

    const nextState = cloneDeep(state)

    nextState.signature = SignatureStatus.SIGNED
    nextState.anchorStatus = AnchorStatus.NOT_REQUESTED

    nextState.log.push(StreamUtils.commitDataToLogEntry(commitData, CommitType.SIGNED))

    const oldContent = state.next?.content ?? state.content
    const oldMetadata = state.next?.metadata ?? state.metadata

    const newContent = jsonpatch.applyPatch(oldContent, payload.data).newDocument
    const newMetadata = { ...oldMetadata, ...payload.header }

    if (newMetadata.schema) {
      // TODO: SchemaValidation.validateSchema does i/o to load a Stream.  We should pre-load
      // the schema into the CommitData so that commit application can be a simple state
      // transformation with no i/o.
      await this._schemaValidator.validateSchema(context.api, newContent, newMetadata.schema)
    }

    nextState.next = {
      content: newContent,
      metadata: newMetadata,
    }

    return nextState
  }

  /**
   * Applies anchor commit
   * @param commitData - Anchor commit
   * @param state - Document state
   * @private
   */
  async _applyAnchor(commitData: CommitData, state: StreamState): Promise<StreamState> {
    return applyAnchorCommit(commitData, state)
  }
}
