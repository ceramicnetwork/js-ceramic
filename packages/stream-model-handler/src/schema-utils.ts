
import ajv, { AnySchema } from 'ajv/dist/2020.js'

type JSONSchemaObjectType = {
  type: 'object',
  additionalProperties?: boolean
}

function traverseObjectRecursivelyAndApplyFunction(o, fn) {
  fn(o)
  for (const i in o) {
    fn.apply(this,[i,o[i]]);  
    if (o[i] !== null && typeof(o[i])=="object") {
      traverseObjectRecursivelyAndApplyFunction(o[i], fn);
    }
  }
}

function isObjectJSONSchema(schema: any): schema is JSONSchemaObjectType {
  return schema &&  schema.type === 'object'
}

function validateObjectHaveAdditionalPropertiesForbidden(schema: AnySchema): void {
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
    schema: AnySchema
  ): Promise<void> {
    const isValid = await this._validator.validateSchema(schema)
    if (!isValid) {
      const errorMessages = this._validator.errorsText()
      throw new Error(`Validation Error: ${errorMessages}`)
    }
    traverseObjectRecursivelyAndApplyFunction(schema, validateObjectHaveAdditionalPropertiesForbidden)
  }
}
