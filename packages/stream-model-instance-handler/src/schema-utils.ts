import ajv, { SchemaObject } from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

/**
 * Simple wrapper around AJV library for doing json-schema validation.
 * TODO: Move schema stream loading out of this.
 */
export class SchemaValidation {
  private readonly _validator = new ajv({
    strict: true,
    allErrors: true,
    allowMatchingProperties: false,
    ownProperties: false,
    unevaluated: false,
  })

  constructor() {
    addFormats(this._validator)
  }

  public validateSchema(content: Record<string, any>, schema: SchemaObject) {
    const isValid = this._validator.validate(schema, content)

    // Remove schema from the Ajv instance's cache, otherwise the ajv cache grows unbounded
    this._validator.removeSchema(schema)

    if (!isValid) {
      const errorMessages = this._validator.errorsText()
      throw new Error(`Validation Error: ${errorMessages}`)
    }
  }
}
