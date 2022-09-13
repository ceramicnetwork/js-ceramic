import ajv, { SchemaObject } from 'ajv/dist/2020.js'

/**
 * A type that we use to check if object properties within JSON Schema schemas
 * allow for additional properties.
 *
 * According to JSON Schema standard, object properties within a valid schema have
 * type field set to 'object' and an optional additionalProperties field that can have a boolean
 * value or a value which is another JSON Schema property schema describing the shape of allowed additional properties
 */
type JSONSchemaObjectType = {
  type: 'object'
  additionalProperties?: boolean
}

/**
 * Takes the schema and applies the fn function to it and its object properties recursively.
 *
 * @param schema a SchemaObject schema from JSON Schema standard
 * @param fn a function taking schema's properties and calls recursiveMap recursively on them, if they're object properties
 *
 */
function recursiveMap(schema: SchemaObject, fn: (schemaProperty: object) => void) {
  fn(schema)
  Object.getOwnPropertyNames(schema).forEach((schemaPropertyName) => {
    if (schema[schemaPropertyName] !== null && typeof schema[schemaPropertyName] == 'object') {
      recursiveMap(schema[schemaPropertyName], fn)
    }
  })
}

/**
 * A typescript type guard function to verify if the input is a JSONSchemaObjectType
 *
 * @param schema - input of any type
 * @returns true iff schema is not null or underfined and it has a type property which equals to 'object'
 *
 * We use this function to traverse JSON Schema schemas and check which property describes an object.
 * According to JSON Schema standard, object properties have type fields set to 'object'.
 */
function isObjectJSONSchema(schema: any): schema is JSONSchemaObjectType {
  return schema && schema.type === 'object'
}

/**
 * Verifies that a JSON Schema schema has additional properties disabled, if it's an object schema
 *
 * @param schema: a SchemaObject schema
 * @throws if the schema is an object schema that allows for additional properties
 */
function validateAdditionalProperties(schema: SchemaObject): void {
  if (isObjectJSONSchema(schema)) {
    if (schema.additionalProperties !== false) {
      throw new Error('All objects in schema need to have additional properties disabled')
    }
  }
}

export class SchemaValidation {
  STANDARD_VERSION = '2020-12'

  private readonly _validator = new ajv({
    strict: true,
    allErrors: true,
    allowMatchingProperties: false,
    ownProperties: false,
    unevaluated: false,
  })

  public async validateSchema(schema: SchemaObject): Promise<void> {
    if (!schema) throw new Error(`Validation Error: schema must be defined`)
    const isValid = await this._validator.validateSchema(schema)

    // Remove schema from the Ajv instance's cache, otherwise the ajv cache grows unbounded
    this._validator.removeSchema(schema)

    if (!isValid) {
      const errorMessages = this._validator.errorsText()
      throw new Error(`Validation Error: ${errorMessages}`)
    }
    recursiveMap(schema, validateAdditionalProperties)
  }
}
