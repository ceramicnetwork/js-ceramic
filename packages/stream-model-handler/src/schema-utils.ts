
import ajv, { SchemaObject } from 'ajv/dist/2020.js'

type JSONSchemaObjectType = {
  type: 'object',
  additionalProperties?: boolean
}

function recursiveMap(schema: SchemaObject, fn: (schemaProperty: object) => void) {
  /**
   * Takes the schema and applies the fn function to it,
   * Next, it iterates through all schema's object-type properties and applies itself recursively to them 
   */
  fn(schema)
  Object.getOwnPropertyNames(schema).forEach((schemaPropertyName) => {
    if (schema[schemaPropertyName] !== null && typeof(schema[schemaPropertyName]) == "object") {
      recursiveMap(schema[schemaPropertyName], fn);
    }
  })
}

function isObjectJSONSchema(schema: any): schema is JSONSchemaObjectType {
  return schema &&  schema.type === 'object'
}

function validateAdditionalProperties(schema: SchemaObject): void {
  /**
   * Checks if schema is of JSONSchemaObjectType type and if so
   * if makes if the schema has additionalProperties set to false (it throws an error otherwise)
   */
  if (isObjectJSONSchema(schema)) {
    if (schema.additionalProperties !== false) {
      throw new Error("All objects in schema need to have additional properties disabled")
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

  public async validateSchema(
    schema: SchemaObject
  ): Promise<void> {
    const isValid = await this._validator.validateSchema(schema)
    if (!isValid) {
      const errorMessages = this._validator.errorsText()
      throw new Error(`Validation Error: ${errorMessages}`)
    }
    recursiveMap(schema, validateAdditionalProperties)
  }
}
