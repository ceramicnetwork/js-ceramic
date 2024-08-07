import jsonpatch from 'fast-json-patch'
import cloneDeep from 'lodash.clonedeep'
import { applyAnchorCommit, SignatureUtils } from '@ceramicnetwork/stream-handler-common'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import {
  AnchorStatus,
  CommitData,
  EventType,
  EnvironmentUtils,
  SignatureStatus,
  StreamConstructor,
  StreamHandler,
  StreamReaderWriter,
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
   * @param context - Interface to read or write to ceramic network
   * @param state - Document state
   */
  async applyCommit(
    commitData: CommitData,
    context: StreamReaderWriter,
    state?: StreamState
  ): Promise<StreamState> {
    if (EnvironmentUtils.useRustCeramic()) {
      throw new Error(`TileDocument is not supported in Ceramic v4 mode`)
    }

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
   * @param context - Interface to read or write to ceramic network
   * @private
   */
  async _applyGenesis(commitData: CommitData, context: StreamReaderWriter): Promise<StreamState> {
    const payload = commitData.commit
    const isSigned = StreamUtils.isSignedCommitData(commitData)
    if (isSigned) {
      const streamId = new StreamID(TileDocument.STREAM_TYPE_ID, commitData.cid)
      const { controllers } = payload.header
      await SignatureUtils.verifyCommitSignature(
        commitData,
        context.signer,
        controllers[0],
        null,
        streamId
      )
    } else if (payload.data) {
      throw Error('Genesis commit with contents should always be signed')
    }

    if (!(payload.header.controllers && payload.header.controllers.length === 1)) {
      throw new Error('Exactly one controller must be specified')
    }
    if (!StreamUtils.validDIDString(payload.header.controllers[0])) {
      throw new Error(
        `Attempting to create a TileDocument with an invalid DID string: ${payload.header.controllers[0]}`
      )
    }

    const state: StreamState = {
      type: TileDocument.STREAM_TYPE_ID,
      content: payload.data || {},
      metadata: payload.header,
      signature: isSigned ? SignatureStatus.SIGNED : SignatureStatus.GENESIS,
      anchorStatus: AnchorStatus.NOT_REQUESTED,
      log: [StreamUtils.commitDataToLogEntry(commitData, EventType.INIT)],
    }

    if (state.metadata.schema) {
      await this._schemaValidator.validateSchema(context, state.content, state.metadata.schema)
    }

    return state
  }

  /**
   * Applies signed commit
   * @param commitData - Signed commit
   * @param state - Document state
   * @param context - Interface to read or write to ceramic network
   * @private
   */
  async _applySigned(
    commitData: CommitData,
    state: StreamState,
    context: StreamReaderWriter
  ): Promise<StreamState> {
    // Retrieve the payload
    const payload = commitData.commit
    StreamUtils.assertCommitLinksToState(state, payload)

    // Verify the signature
    const controller = state.next?.metadata?.controllers?.[0] || state.metadata.controllers[0]
    if (!controller) throw new Error(`Controller is not set`)
    const streamId = StreamUtils.streamIdFromState(state)
    await SignatureUtils.verifyCommitSignature(
      commitData,
      context.signer,
      controller,
      null,
      streamId
    )

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

    state.signature = SignatureStatus.SIGNED
    state.anchorStatus = AnchorStatus.NOT_REQUESTED

    state.log.push(StreamUtils.commitDataToLogEntry(commitData, EventType.DATA))

    const oldContent = state.next?.content ?? cloneDeep(state.content)
    const oldMetadata = state.next?.metadata ?? state.metadata

    const newContent = jsonpatch.applyPatch(oldContent, payload.data).newDocument
    const newMetadata = { ...oldMetadata, ...payload.header }

    if (newMetadata.schema) {
      // TODO: SchemaValidation.validateSchema does i/o to load a Stream.  We should pre-load
      // the schema into the CommitData so that commit application can be a simple state
      // transformation with no i/o.
      await this._schemaValidator.validateSchema(context, newContent, newMetadata.schema)
    }

    state.next = {
      content: newContent,
      metadata: newMetadata,
    }

    return state
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
