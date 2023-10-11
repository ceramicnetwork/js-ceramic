import Ajv, { SchemaObject } from 'ajv/dist/2020.js'
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
  readonly validators: LRUCache<string, Ajv>

  constructor() {
    this.validators = new LRUCache(AJV_CACHE_SIZE)
  }

  public validateSchema(content: Record<string, any>, schema: SchemaObject, schemaId: string) {
    let validator = this.validators.get(schemaId)
    if (!validator) {
      validator = buildAjv()
      this.validators.set(schemaId, validator)
    }
    const isValid = validator.validate(schema, content)

    if (!isValid) {
      const errorMessages = validator.errorsText()
      throw new Error(`Validation Error: ${errorMessages}`)
    }
  }
}
