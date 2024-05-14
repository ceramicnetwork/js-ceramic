import Ajv, { SchemaObject, ValidateFunction } from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { LRUCache } from 'least-recent'

const AJV_CACHE_SIZE = 500

function buildAjv(): Ajv {
  const validator = new Ajv({
    strict: true,
    allErrors: true,
    allowMatchingProperties: false,
    ownProperties: false,
    unevaluated: false,
  })
  addFormats(validator)
  return validator
}

/**
 * Simple wrapper around AJV library for doing json-schema validation.
 * TODO: Move schema stream loading out of this.
 */
export class SchemaValidation {
  readonly ajv: Ajv
  readonly schemas: LRUCache<string, ValidateFunction>

  constructor() {
    this.ajv = buildAjv()
    this.schemas = new LRUCache(AJV_CACHE_SIZE)
  }

  public validateSchema(content: Record<string, any>, schema: SchemaObject, schemaId: string) {
    let existingSchema = this.schemas.get(schemaId)
    if (!existingSchema) {
      existingSchema = this.ajv.compile(schema)
      this.schemas.set(schemaId, existingSchema)
    }
    const isValid = existingSchema(content)

    if (!isValid) {
      const errorMessages = this.ajv.errorsText(existingSchema.errors)
      throw new Error(`Validation Error: ${errorMessages}`)
    }
  }
}
