import Ajv, { SchemaObject } from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

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

  constructor() {
    this.ajv = buildAjv()
  }

  public validateSchema(content: Record<string, any>, schema: SchemaObject, schemaId: string) {
    let existingSchema = this.ajv.getSchema(schemaId)
    if (!existingSchema) {
      this.ajv.addSchema(schema, schemaId)
      //we've added the schema above, so ajv will have it
      existingSchema = this.ajv.getSchema(schemaId)!
    }
    const isValid = existingSchema(content)

    if (!isValid) {
      const errorMessages = this.ajv.errorsText(existingSchema.errors)
      throw new Error(`Validation Error: ${errorMessages}`)
    }
  }
}
