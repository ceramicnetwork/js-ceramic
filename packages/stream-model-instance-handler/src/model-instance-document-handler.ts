import jsonpatch from 'fast-json-patch'
import {
  ModelInstanceDocument,
  ModelInstanceDocumentMetadata,
  ModelInstanceDocumentStateMetadata,
  validateContentLength,
} from '@ceramicnetwork/stream-model-instance'
import {
  AnchorStatus,
  CommitData,
  EventType,
  SignatureStatus,
  SignatureUtils,
  StreamConstructor,
  StreamHandler,
  StreamReader,
  StreamReaderWriter,
  StreamState,
  StreamUtils,
  UnreachableCaseError,
} from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import { SchemaValidation } from 'ajv-threads'
import { Model, ModelDefinitionV2 } from '@ceramicnetwork/stream-model'
import { applyAnchorCommit } from '@ceramicnetwork/stream-handler-common'
import { toString } from 'uint8arrays'

// Hardcoding the model streamtype id to avoid introducing a dependency on the stream-model package
const MODEL_STREAM_TYPE_ID = 2

type Payload = {
  data: JsonPatchOperation[]
}

type JsonPatchOperation = {
  op: string
  path: string
  value?: any
  from?: string
}

interface ModelInstanceDocumentHeader extends ModelInstanceDocumentMetadata {
  unique?: Uint8Array
}

/**
 * ModelInstanceDocument stream handler implementation
 */
export class ModelInstanceDocumentHandler implements StreamHandler<ModelInstanceDocument> {
  private _schemaValidator: SchemaValidation

  constructor() {
    this._schemaValidator = new SchemaValidation()
  }

  async init() {
    await this._schemaValidator.init()
  }

  async shutdown(): Promise<void> {
    await this._schemaValidator.shutdown()
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
   * @param context - Interface to read and write data to ceramic network
   * @param state - Document state
   */
  async applyCommit(
    commitData: CommitData,
    context: StreamReaderWriter,
    state?: StreamState<ModelInstanceDocumentStateMetadata>
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
  async _applyGenesis(commitData: CommitData, context: StreamReaderWriter): Promise<StreamState> {
    const payload = commitData.commit
    const { controllers, model, context: ctx, unique } = payload.header
    const controller = controllers[0]
    const modelStreamID = StreamID.fromBytes(model)
    const streamId = new StreamID(ModelInstanceDocument.STREAM_TYPE_ID, commitData.cid)
    const metadata: ModelInstanceDocumentStateMetadata = {
      controllers: [controller],
      model: modelStreamID,
      unique,
    }
    if (ctx) {
      metadata.context = StreamID.fromBytes(ctx)
    }

    if (!(payload.header.controllers && payload.header.controllers.length === 1)) {
      throw new Error('Exactly one controller must be specified')
    }
    if (!StreamUtils.validDIDString(payload.header.controllers[0])) {
      throw new Error(
        `Attempting to create a ModelInstanceDocument with an invalid DID string: ${payload.header.controllers[0]}`
      )
    }
    if (modelStreamID.type != MODEL_STREAM_TYPE_ID) {
      throw new Error(`Model for ModelInstanceDocument must refer to a StreamID of a Model stream`)
    }

    const isSigned = StreamUtils.isSignedCommitData(commitData)
    if (isSigned) {
      await SignatureUtils.verifyCommitSignature(
        commitData,
        context.signer,
        controller,
        modelStreamID,
        streamId
      )
    } else if (payload.data) {
      throw Error('ModelInstanceDocument genesis commit with content must be signed')
    }

    const modelStream = await context.loadStream<Model>(metadata.model)
    this._validateModel(modelStream)
    await this._validateContent(context, modelStream, payload.data, true)
    await this._validateHeader(modelStream, payload.header)

    return {
      type: ModelInstanceDocument.STREAM_TYPE_ID,
      content: payload.data || null,
      metadata,
      signature: SignatureStatus.SIGNED,
      anchorStatus: AnchorStatus.NOT_REQUESTED,
      log: [StreamUtils.commitDataToLogEntry(commitData, EventType.INIT)],
    }
  }

  /**
   * Applies signed commit
   * @param commitData - Signed commit
   * @param state - Document state
   * @param context - Interface to read and write to ceramic network
   * @private
   */
  async _applySigned(
    commitData: CommitData,
    state: StreamState<ModelInstanceDocumentStateMetadata>,
    context: StreamReaderWriter
  ): Promise<StreamState> {
    // Retrieve the payload
    const payload = commitData.commit
    StreamUtils.assertCommitLinksToState(state, payload)

    // Verify the signature
    const metadata = state.metadata
    const controller = metadata.controllers[0]
    const model = metadata.model
    const streamId = StreamUtils.streamIdFromState(state)
    await SignatureUtils.verifyCommitSignature(
      commitData,
      context.signer,
      controller,
      model,
      streamId
    )

    if (payload.header) {
      const { shouldIndex, ...others } = payload.header
      const otherKeys = Object.keys(others)
      if (otherKeys.length) {
        throw new Error(
          `Updating metadata for ModelInstanceDocument Streams is not allowed.  Tried to change metadata for Stream ${streamId} from ${JSON.stringify(
            state.metadata
          )} to ${JSON.stringify(payload.header)}\``
        )
      }
      if (shouldIndex != null) {
        state.metadata.shouldIndex = shouldIndex
      }
    }

    const oldContent = state.content ?? {}
    const newContent = jsonpatch.applyPatch(oldContent, payload.data).newDocument
    const modelStream = await context.loadStream<Model>(metadata.model)
    await this._validateContent(context, modelStream, newContent, false, payload)
    await this._validateUnique(
      modelStream,
      metadata as unknown as ModelInstanceDocumentMetadata,
      newContent
    )

    state.signature = SignatureStatus.SIGNED
    state.anchorStatus = AnchorStatus.NOT_REQUESTED
    state.content = newContent
    state.log.push(StreamUtils.commitDataToLogEntry(commitData, EventType.DATA))

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

  /**
   * Validates the ModelInstanceDocument can be created for the given model
   * @param model - The model that this ModelInstanceDocument belongs to
   * @private
   */
  _validateModel(model: Model): void {
    if (model.content.version !== '1.0' && model.content.interface) {
      throw new Error(
        `ModelInstanceDocument Streams cannot be created on interface Models. Use a different model than ${model.id.toString()} to create the ModelInstanceDocument.`
      )
    }
  }

  /**
   * Validates content against the schema of the model stream with given stream id
   * @param ceramic - Interface for reading streams from ceramic network
   * @param model - The model that this ModelInstanceDocument belongs to
   * @param content - content to validate
   * @param genesis - whether the commit being applied is a genesis commit
   * @private
   */
  async _validateContent(
    ceramic: StreamReader,
    model: Model,
    content: any,
    genesis: boolean,
    payload?: Payload
  ): Promise<void> {
    if (
      genesis &&
      (model.content.accountRelation.type === 'single' ||
        model.content.accountRelation.type === 'set')
    ) {
      if (content) {
        throw new Error(
          `Deterministic genesis commits for ModelInstanceDocuments must not have content`
        )
      }
      return
    }

    validateContentLength(content)

    await this._schemaValidator.validateSchema(
      content,
      model.content.schema,
      model.commitId.toString()
    )

    // Now validate the relations
    await this._validateRelationsContent(ceramic, model, content)
    if (!genesis && payload) {
      await this._validateLockedFieldsUpdate(model, payload)
    }
  }

  async _validateRelationsContent(ceramic: StreamReader, model: Model, content: any) {
    if (!model.content.relations) {
      return
    }

    for (const [fieldName, relationDefinition] of Object.entries(model.content.relations)) {
      const relationType = relationDefinition.type
      switch (relationType) {
        case 'account':
          continue
        case 'document': {
          // Ignore validation if the target field is empty
          if (content[fieldName] == null) {
            continue
          }

          // Validate StreamID value
          let midStreamId
          try {
            midStreamId = StreamID.fromString(content[fieldName])
          } catch (err: any) {
            throw new Error(
              `Error while parsing relation from field ${fieldName}: Invalid StreamID: ${err.toString()}`
            )
          }

          // Ensure linked stream can be loaded and is a MID
          const linkedMid = await ModelInstanceDocument.load(ceramic, midStreamId)

          // Check for expected model the MID must use
          const expectedModelStreamId = relationDefinition.model
          if (expectedModelStreamId == null) {
            continue
          }

          const foundModelStreamId = linkedMid.metadata.model.toString()
          if (foundModelStreamId === expectedModelStreamId) {
            // Exact model used
            continue
          }

          // Other model used, check if it implements the expected interface
          const linkedModel = await Model.load(ceramic, foundModelStreamId)
          if (
            linkedModel.content.version !== '1.0' &&
            linkedModel.content.implements.includes(expectedModelStreamId)
          ) {
            continue
          }

          throw new Error(
            `Relation on field ${fieldName} points to Stream ${midStreamId.toString()}, which belongs to Model ${foundModelStreamId}, but this Stream's Model (${model.id.toString()}) specifies that this relation must be to a Stream in the Model ${expectedModelStreamId}`
          )
        }
        default:
          throw new UnreachableCaseError(relationType, 'Unknown relation type')
      }
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

  /**
   *  Helper function to validate if immutable fields are being mutated
   */
  async _validateLockedFieldsUpdate(model: Model, payload: Payload): Promise<void> {
    if (!ModelDefinitionV2.is(model.content)) return
    const immutableFields = model.content.immutableFields
    const hasImmutableFields = immutableFields && immutableFields.length > 0
    if (!hasImmutableFields) return

    for (const lockedField of immutableFields) {
      const mutated = payload.data.some(
        (entry) => entry.path.slice(1).split('/').shift() === lockedField
      )
      if (mutated) {
        throw new Error(`Immutable field "${lockedField}" cannot be updated`)
      }
    }
  }

  /*
   * Validates the ModelInstanceDocument unique constraints against the Model definition.
   * @param model - model that this ModelInstanceDocument belongs to
   * @param metadata - ModelInstanceDocument metadata to validate
   * @param content - ModelInstanceDocument content to validate
   */
  async _validateUnique(
    model: Model,
    metadata: ModelInstanceDocumentMetadata,
    content: Record<string, unknown> | null
  ): Promise<void> {
    // Unique field validation only applies to the SET account relation
    if (model.content.accountRelation.type !== 'set') {
      return
    }
    if (metadata.unique == null) {
      throw new Error('Missing unique metadata value')
    }
    if (content == null) {
      throw new Error('Missing content')
    }

    const unique = model.content.accountRelation.fields
      .map((field) => {
        const value = content[field]
        return value ? String(value) : ''
      })
      .join('|')
    if (unique !== toString(metadata.unique)) {
      throw new Error(
        'Unique content fields value does not match metadata. If you are trying to change the value of these fields, this is causing this error: these fields values are not mutable.'
      )
    }
  }
}
