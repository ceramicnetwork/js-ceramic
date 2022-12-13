import { Model } from '@ceramicnetwork/stream-model'
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
import { applyAnchorCommit } from '@ceramicnetwork/stream-handler-common'

// Keys of the 'ModelDefinition' type.  Unfortunately typescript doesn't provide a way to access
// these programmatically.
const ALLOWED_CONTENT_KEYS = new Set([
  'name',
  'description',
  'schema',
  'accountRelation',
  'relations',
  'views',
])

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
    if (process.env.CERAMIC_ENABLE_EXPERIMENTAL_COMPOSE_DB != 'true') {
      context.loggerProvider
        .getDiagnosticsLogger()
        .err(
          'Indexing is an experimental feature and is not yet supported in production. To enable for testing purposes only, set the CERAMIC_ENABLE_EXPERIMENTAL_COMPOSE_DB environment variable to `true`'
        )
      throw new Error('Indexing is not enabled')
    }

    if (state == null) {
      // apply genesis
      return this._applyGenesis(commitData, context)
    }

    if (StreamUtils.isAnchorCommitData(commitData)) {
      return this._applyAnchor(commitData, state)
    }

    throw new Error('Cannot update a finalized Model')
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
    Model.assertComplete(payload.data)
    Model.assertRelationsValid(payload.data)

    const modelStreamId = StreamID.fromBytes(payload.header.model)
    if (!modelStreamId.equals(Model.MODEL)) {
      throw new Error(
        `Invalid 'model' metadata property in Model stream: ${modelStreamId.toString()}`
      )
    }

    const metadata = { controllers: [controller], model: modelStreamId }
    const state: StreamState = {
      type: Model.STREAM_TYPE_ID,
      content: payload.data,
      metadata,
      signature: SignatureStatus.SIGNED,
      anchorStatus: AnchorStatus.NOT_REQUESTED,
      log: [StreamUtils.commitDataToLogEntry(commitData, CommitType.GENESIS)],
    }

    await this._schemaValidator.validateSchema(state.content.schema)
    if (state.content.views) {
      this._viewsValidator.validateViews(state.content.views, state.content.schema)
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
