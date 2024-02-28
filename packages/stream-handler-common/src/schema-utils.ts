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
  readonly validators: LRUCache<string, Ajv>

  constructor() {
    this.validators = new LRUCache(AJV_CACHE_SIZE)
  }

  private _getValidator(schemaId: string): Ajv {
    let validator = this.validators.get(schemaId)
    if (!validator) {
      validator = buildAjv()
      this.validators.set(schemaId, validator)
    }
    return validator
  }

  /**
   * Asserts that the given schema object contains a valid jsonSchema.
   */
  public async assertSchemaIsValid(schema: SchemaObject): Promise<void> {
    if (!schema) throw new Error(`Validation Error: schema must be defined`)
    const validator = this._getValidator('default')
    const isValid = await validator.validateSchema(schema)

    // Remove schema from the Ajv instance's cache, otherwise the ajv cache grows unbounded
    validator.removeSchema(schema)

    if (!isValid) {
      const errorMessages = validator.errorsText()
      throw new Error(`Validation Error: ${errorMessages}`)
    }
    recursiveMap(schema, validateAdditionalProperties)
  }

  /**
   * Validates that the given piece of content conforms to the given jsonSchema
   * @param content - content to validate against the schema
   * @param schema - schema to use to validate the content
   * @param schemaId - unique identifier to identify the schema being used. We use this to use a
   * different Ajv instance for each schema, as we've seen memory leaks inside of Ajv otherwise.
   */
  public validateSchema(content: Record<string, any>, schema: SchemaObject, schemaId: string) {
    const validator = this._getValidator(schemaId)
    const isValid = validator.validate(schema, content)

    if (!isValid) {
      const errorMessages = validator.errorsText()
      throw new Error(`Validation Error: ${errorMessages}`)
    }
  }
}
