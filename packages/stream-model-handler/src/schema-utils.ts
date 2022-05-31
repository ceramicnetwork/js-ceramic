
import ajv, { SchemaObject } from 'ajv/dist/2020.js'

type JSONSchemaObjectType = {
  type: 'object',
  additionalProperties?: boolean
}

function applyFuntionToSchemaAndItsObjectPropsRecursively(schema: SchemaObject, fn: (schemaProperty: object) => void) {
  fn(schema)
  Object.getOwnPropertyNames(schema).forEach((schemaPropertyName) => {
    if (schema[schemaPropertyName] !== null && typeof(schema[schemaPropertyName]) == "object") {
      applyFuntionToSchemaAndItsObjectPropsRecursively(schema[schemaPropertyName], fn);
    }
  })
}

function isObjectJSONSchema(schema: any): schema is JSONSchemaObjectType {
  return schema &&  schema.type === 'object'
}

function validateObjectHaveAdditionalPropertiesForbidden(schema: SchemaObject): void {
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
    applyFuntionToSchemaAndItsObjectPropsRecursively(schema, validateObjectHaveAdditionalPropertiesForbidden)
  }
}
