import jsonpatch from 'fast-json-patch'
import cloneDeep from 'lodash.clonedeep'
import {
  ModelInstanceDocument,
  ModelInstanceDocumentMetadata,
} from '@ceramicnetwork/stream-model-instance'
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
import { applyAnchorCommit } from '@ceramicnetwork/stream-handler-common'

// Hardcoding the model streamtype id to avoid introducing a dependency on the stream-model package
const MODEL_STREAM_TYPE_ID = 2

interface ModelInstanceDocumentHeader extends ModelInstanceDocumentMetadata {
  unique?: Uint8Array
}

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
    const { controllers, model } = payload.header
    const controller = controllers[0]
    const modelStreamID = StreamID.fromBytes(model)
    const streamId = await StreamID.fromGenesis('MID', commitData.commit)
    const metadata = { controllers: [controller], model: modelStreamID }

    if (!(payload.header.controllers && payload.header.controllers.length === 1)) {
      throw new Error('Exactly one controller must be specified')
    }
    if (modelStreamID.type != MODEL_STREAM_TYPE_ID) {
      throw new Error(`Model for ModelInstanceDocument must refer to a StreamID of a Model stream`)
    }

    const isSigned = StreamUtils.isSignedCommitData(commitData)
    if (isSigned) {
      await SignatureUtils.verifyCommitSignature(
        commitData,
        context.did,
        controller,
        modelStreamID,
        streamId
      )
    } else if (payload.data || payload.header.unique) {
      throw Error('ModelInstanceDocument genesis commit with content must be signed')
    }

    const modelStream = await context.api.loadStream<Model>(metadata.model)
    await this._validateContent(modelStream, payload.data, true)
    await this._validateHeader(modelStream, payload.header)

    return {
      type: ModelInstanceDocument.STREAM_TYPE_ID,
      content: payload.data || {},
      metadata,
      signature: SignatureStatus.SIGNED,
      anchorStatus: AnchorStatus.NOT_REQUESTED,
      log: [{ cid: commitData.cid, type: CommitType.GENESIS }],
    }
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
        `Updating metadata for ModelInstanceDocument Streams is not allowed.  Tried to change metadata for Stream ${streamId} from ${JSON.stringify(
          state.metadata
        )} to ${JSON.stringify(payload.header)}\``
      )
    }

    const oldContent = state.content
    const newContent = jsonpatch.applyPatch(oldContent, payload.data).newDocument
    const modelStream = await context.api.loadStream<Model>(metadata.model)
    await this._validateContent(modelStream, newContent, false)

    const nextState = cloneDeep(state)
    nextState.signature = SignatureStatus.SIGNED
    nextState.anchorStatus = AnchorStatus.NOT_REQUESTED
    nextState.content = newContent
    nextState.log.push({ cid: commitData.cid, type: CommitType.SIGNED })

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

  /**
   * Validates content against the schema of the model stream with given stream id
   * @param model - The model that this ModelInstanceDocument belongs to
   * @param content - content to validate
   * @param genesis - whether the commit being applied is a genesis commit
   * @private
   */
  async _validateContent(model: Model, content: any, genesis: boolean): Promise<void> {
    if (genesis && model.content.accountRelation.type === 'single') {
      if (content) {
        throw new Error(
          `Deterministic genesis commits for ModelInstanceDocuments must not have content`
        )
      }
    } else {
      await this._schemaValidator.validateSchema(
        content,
        model.content.schema,
        model.commitId.toString()
      )
    }
  }

  /**
   * Validates the ModelInstanceDocument header against the Model definition.
   * @param model - The model that this ModelInstanceDocument belongs to
   * @param header - the header to validate
   */
  async _validateHeader(model: Model, header: ModelInstanceDocumentHeader): Promise<void> {
    if (model.content.accountRelation.type === 'single') {
      if (header.unique) {
        throw new Error(
          `ModelInstanceDocuments for models with SINGLE accountRelations must be created deterministically`
        )
      }
    } else {
      if (!header.unique) {
        throw new Error(
          `Deterministic ModelInstanceDocuments are only allowed on models that have the SINGLE accountRelation`
        )
      }
    }
  }
}
