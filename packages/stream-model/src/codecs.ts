import { didString, streamIdAsBytes, streamIdString } from '@ceramicnetwork/codecs'
import Ajv from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import {
  Type,
  type TypeOf,
  identity,
  literal,
  optional,
  record,
  sparse,
  strict,
  string,
  union,
} from 'codeco'
import type { JSONSchema } from 'json-schema-typed/draft-2020-12'

const ajv = new Ajv({
  strict: true,
  allErrors: true,
  allowMatchingProperties: false,
  ownProperties: false,
  unevaluated: false,
})
addFormats(ajv)

export type { JSONSchema } from 'json-schema-typed/draft-2020-12'

export type SchemaType =
  | JSONSchema.Boolean
  | JSONSchema.Integer
  | JSONSchema.Number
  | JSONSchema.String
  | JSONSchema.Array
  | JSONSchema.Object

export function createSchemaType<T extends SchemaType>(type: T['type'], name: string): Type<T> {
  function isSchemaType(input: unknown): input is T {
    return typeof input === 'object' && input != null && (input as T).type === type
  }

  return new Type<T>(
    name,
    isSchemaType,
    (input, context) => {
      if (!isSchemaType(input)) {
        return context.failure(`Input is not a JSON schema of type: ${type as string}`)
      }

      const isValid = ajv.validateSchema(input)
      // Remove schema from the Ajv instance's cache, otherwise the ajv cache grows unbounded
      ajv.removeSchema(input)

      return isValid
        ? context.success(input)
        : context.failure(`Validation Error: ${ajv.errorsText()}`)
    },
    identity
  )
}

export const ObjectSchema = createSchemaType<JSONSchema.Object>('object', 'ObjectSchema')
export type ObjectSchema = TypeOf<typeof ObjectSchema>

/**
 * Metadata for a Model Stream
 */
export const ModelMetadata = strict(
  {
    /**
     * The DID that is allowed to author updates to this Model
     */
    controller: didString,
    /**
     * The StreamID that all Model streams have as their 'model' for indexing purposes. Note that
     * this StreamID doesn't refer to a valid Stream and cannot be loaded, it's just a way to index
     * all Models.
     */
    model: streamIdAsBytes,
  },
  'ModelMetadata'
)
export type ModelMetadata = TypeOf<typeof ModelMetadata>

/**
 * Represents the relationship between an instance of this model and the controller account.
 * 'list' means there can be many instances of this model for a single account. 'single' means
 * there can be only one instance of this model per account (if a new instance is created it
 * overrides the old one).
 */
export const ModelAccountRelation = union(
  [strict({ type: literal('list') }), strict({ type: literal('single') })],
  'ModelAccountRelation'
)
export type ModelAccountRelation = TypeOf<typeof ModelAccountRelation>

/**
 * Identifies types of properties that are supported as relations by the indexing service.
 *
 * Currently supported types of relation properties:
 * - 'account': references a DID property
 * - 'document': references a StreamID property with associated 'model' the related document must use
 *
 */
export const ModelRelationDefinition = union(
  [
    strict({ type: literal('account') }),
    strict({ type: literal('document'), model: streamIdString }),
  ],
  'ModelRelationDefinition'
)
export type ModelRelationDefinition = TypeOf<typeof ModelRelationDefinition>

/**
 * A mapping between model's property names and types of relation properties
 *
 * It indicates which properties of a model are relation properties and of what type
 */
export const ModelRelationsDefinition = record(
  string,
  ModelRelationDefinition,
  'ModelRelationsDefinition'
)
export type ModelRelationsDefinition = TypeOf<typeof ModelRelationsDefinition>

export const ModelDocumentMetadataViewDefinition = union(
  [strict({ type: literal('documentAccount') }), strict({ type: literal('documentVersion') })],
  'ModelDocumentMetadataViewDefinition'
)
export type ModelDocumentMetadataViewDefinition = TypeOf<typeof ModelDocumentMetadataViewDefinition>

export const ModelRelationViewDefinition = union(
  [
    strict({ type: literal('relationDocument'), model: streamIdString, property: string }),
    strict({ type: literal('relationFrom'), model: streamIdString, property: string }),
    strict({ type: literal('relationCountFrom'), model: streamIdString, property: string }),
  ],
  'ModelRelationViewDefinition'
)
export type ModelRelationViewDefinition = TypeOf<typeof ModelRelationViewDefinition>

/**
 * Identifies types of properties that are supported as view properties at DApps' runtime
 *
 * A view-property is one that is not stored in related MIDs' content, but is derived from their other properties
 *
 * Currently supported types of view properties:
 * - 'documentAccount': view properties of this type have the MID's controller DID as values
 * - 'documentVersion': view properties of this type have the MID's commit ID as values
 * - 'relationDocument': view properties of this type represent document relations identified by the given 'property' field
 * - 'relationFrom': view properties of this type represent inverse relations identified by the given 'model' and 'property' fields
 * - 'relationCountFrom': view properties of this type represent the number of inverse relations identified by the given 'model' and 'property' fields
 *
 */
export const ModelViewDefinition = union(
  [ModelDocumentMetadataViewDefinition, ModelRelationViewDefinition],
  'ModelViewDefinition'
)
export type ModelViewDefinition = TypeOf<typeof ModelViewDefinition>

/**
 * A mapping between model's property names and types of view properties
 *
 * It indicates which properties of a model are view properties and of what type
 */
export const ModelViewsDefinition = record(string, ModelViewDefinition, 'ModelViewDefinition')
export type ModelViewsDefinition = TypeOf<typeof ModelViewsDefinition>

/**
 * Contents of a Model Stream.
 */
export const ModelDefinition = sparse({
  version: string,
  name: string,
  description: optional(string),
  schema: ObjectSchema,
  accountRelation: ModelAccountRelation,
  relations: optional(ModelRelationsDefinition),
  views: optional(ModelViewsDefinition),
})
export type ModelDefinition = TypeOf<typeof ModelDefinition>
