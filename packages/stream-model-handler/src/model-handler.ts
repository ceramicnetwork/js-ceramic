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
import { SchemaValidation } from './schema-utils.js'
import { ViewsValidation } from './views-utils.js'

// Keys of the 'ModelDefinition' type.  Unfortunately typescript doesn't provide a way to access
// these programmatically.
const ALLOWED_CONTENT_KEYS = new Set(['name', 'description', 'schema', 'accountRelation', 'views'])

/**
 * Helper function for asserting that the content of a Model Stream only contains the expected fields
 */
const assertNoExtraKeys = function (content: Record<string, any>) {
  for (const key of Object.keys(content)) {
    if (!ALLOWED_CONTENT_KEYS.has(key)) {
      throw new Error(`Unexpected key '${key}' found in content for Model Stream`)
    }
  }
}

/**
 * Model stream handler implementation
 */
export class ModelHandler implements StreamHandler<Model> {
  private readonly _schemaValidator: SchemaValidation
  private readonly _viewsValidator: ViewsValidation

  get type(): number {
    return Model.STREAM_TYPE_ID
  }

  get name(): string {
    return Model.STREAM_TYPE_NAME
  }

  get stream_constructor(): StreamConstructor<Model> {
    return Model
  }

  constructor() {
    this._schemaValidator = new SchemaValidation()
    this._viewsValidator = new ViewsValidation()
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
    if (!process.env.CERAMIC_ENABLE_EXPERIMENTAL_INDEXING) {
      context.loggerProvider
        .getDiagnosticsLogger()
        .err(
          'Indexing is an experimental feature and is not yet supported in production. To enable for testing purposes only, set the CERAMIC_ENABLE_EXPERIMENTAL_INDEXING environment variable'
        )
      throw new Error('Indexing is not enabled')
    }

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
      throw Error('Model genesis commit must be signed')
    }

    if (!(payload.header.controllers && payload.header.controllers.length === 1)) {
      throw new Error('Exactly one controller must be specified')
    }

    const streamId = await StreamID.fromGenesis('model', commitData.commit)
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

    assertNoExtraKeys(payload.data)

    const modelStreamId = StreamID.fromBytes(payload.header.model)
    if (!modelStreamId.equals(Model.MODEL)) {
      throw new Error(
        `Invalid 'model' metadata property in Model stream: ${modelStreamId.toString()}`
      )
    }

    const metadata = { controllers: [controller], model: modelStreamId }
    const state = {
      type: Model.STREAM_TYPE_ID,
      content: payload.data,
      metadata,
      signature: SignatureStatus.SIGNED,
      anchorStatus: AnchorStatus.NOT_REQUESTED,
      log: [{ cid: commitData.cid, type: CommitType.GENESIS }],
    }

    if (state.content.schema) {
      await this._schemaValidator.validateSchema(state.content.schema)
      if (state.content.views) {
        this._viewsValidator.validateViews(state.content.views, state.content.schema)
      }
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
    // Retrieve the payload
    const payload = commitData.commit
    StreamUtils.assertCommitLinksToState(state, payload)

    // Verify the signature
    const metadata = state.metadata
    const controller = metadata.controllers[0]
    const model = metadata.model
    const streamId = StreamUtils.streamIdFromState(state)
    await SignatureUtils.verifyCommitSignature(commitData, context.did, controller, model, streamId)

    if (payload.header) {
      throw new Error(
        `Updating metadata for Model Streams is not allowed.  Tried to change metadata for Stream ${streamId} from ${JSON.stringify(
          state.metadata
        )} to ${JSON.stringify(payload.header)}\``
      )
    }

    const oldContent: ModelDefinition = state.content
    if (oldContent.name && oldContent.schema && oldContent.accountRelation) {
      throw new Error('Cannot update a finalized Model')
    }
    const newContent: ModelDefinition = jsonpatch.applyPatch(oldContent, payload.data).newDocument
    // Cannot update a placeholder Model other than to finalize it.
    Model.assertComplete(newContent, streamId)
    assertNoExtraKeys(newContent)

    await this._schemaValidator.validateSchema(newContent.schema)
    if (newContent.views) {
      this._viewsValidator.validateViews(newContent.views, newContent.schema)
    }

    const nextState = cloneDeep(state)
    nextState.signature = SignatureStatus.SIGNED
    nextState.anchorStatus = AnchorStatus.NOT_REQUESTED
    nextState.content = newContent
    nextState.log.push({ cid: commitData.cid, type: CommitType.SIGNED })

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
    StreamUtils.assertCommitLinksToState(state, commitData.commit)

    const proof = commitData.proof
    const newState = {
      ...state,
      anchorStatus: AnchorStatus.ANCHORED,
      anchorProof: proof,
    }
    newState.log.push({
      cid: commitData.cid,
      type: CommitType.ANCHOR,
      timestamp: proof.blockTimestamp,
    })
    delete newState.anchorScheduledFor

    return newState
  }
}
