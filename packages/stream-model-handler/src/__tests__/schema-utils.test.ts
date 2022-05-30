import { SchemaValidation } from "../schema-utils"

describe('SchemaValidation', () => {  
  let schemaValidator: SchemaValidation

  beforeAll(async () => {
    schemaValidator = new SchemaValidation()
  })

  it('validates correct 2020-12 schema', async () => {
    expect(schemaValidator.validateSchema({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: 'object',
      props: {
        stringPropName: {
          type: 'string',
          maxLength: 80,
        },
      },
      additionallyProperties: false,
      required: ['stringPropName'],
    })).resolves.not.toThrow()
  })
  it('returns false for an incorrect 2020-12 schema', async () => {
    expect(schemaValidator.validateSchema({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: 'object',
      properties: {
        stringPropName: {
          type: 'CLEARLY_A_WRONG_TYPE',
        },
      },
      $defs: ['$DEFS_SHOULD_BE_AN_OBJECT'],
      additionalProperties: false,
      required: 'THIS_SHOULD_BE_AN_ARRAY_OF_STRINGS',
    }))
    .rejects
    .toThrow("Validation Error: data/$defs must be object, data/properties/stringPropName/type must be equal to one of the allowed values, data/properties/stringPropName/type must be array, data/properties/stringPropName/type must match a schema in anyOf, data/required must be array")
  }) 
})