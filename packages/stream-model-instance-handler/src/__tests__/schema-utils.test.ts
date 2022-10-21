import { SchemaValidation } from '../schema-utils.js'
import { ModelDefinition } from '@ceramicnetwork/stream-model'

const SCHEMA_COMMIT_ID = 'k3y52l7mkcvtg023bt9txegccxe1bah8os3naw5asin3baf3l3t54atn0cuy98yws'

const MODEL_DEFINITION: ModelDefinition = {
  name: 'MyModel',
  accountRelation: { type: 'list' },
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    additionalProperties: false,
    properties: {
      arrayProperty: {
        type: 'array',
        items: {
          type: 'integer',
        },
        minItems: 2,
        maxItems: 4,
      },
      stringArrayProperty: {
        type: 'array',
        items: {
          type: 'string',
          maxLength: 6,
          minLength: 2,
        },
      },
      stringProperty: {
        type: 'string',
        maxLength: 8,
        minLength: 3,
      },
      intProperty: {
        type: 'integer',
        maximum: 100,
        minimum: 2,
      },
      floatProperty: {
        type: 'number',
        maximum: 110,
        minimum: 3,
      },
    },
    required: [
      'arrayProperty',
      'stringArrayProperty',
      'stringProperty',
      'intProperty',
      'floatProperty',
    ],
  },
}

const CONTENT_VALID = {
  arrayProperty: [0, 2, 3, 4],
  stringArrayProperty: ['abcdef'],
  stringProperty: 'abcdefgh',
  intProperty: 80,
  floatProperty: 104,
}

const CONTENT_NO_REQ_PROPS = {}

const CONTENT_MINS_NOT_RESPECTED = {
  arrayProperty: [0],
  stringArrayProperty: ['a'],
  stringProperty: 'ab',
  intProperty: 1,
  floatProperty: 2.9,
}

const CONTENT_MAXS_NOT_RESPECTED = {
  arrayProperty: [0, 2, 3, 4, 5],
  stringArrayProperty: ['abcdefg'],
  stringProperty: 'abcdefghi',
  intProperty: 101,
  floatProperty: 115,
}

const CONTENT_WITH_ADDITIONAL_PROPERTY = {
  arrayProperty: [0, 2, 3, 4],
  stringArrayProperty: ['abcdef'],
  stringProperty: 'abcdefgh',
  intProperty: 80,
  floatProperty: 104,
  additionalProperty: 'I should not be here',
}

describe('SchemaValidation', () => {
  let schemaValidator: SchemaValidation

  beforeAll(async () => {
    schemaValidator = new SchemaValidation()
  })

  it('validates content that conforms to schema', () => {
    expect(() => {
      schemaValidator.validateSchema(CONTENT_VALID, MODEL_DEFINITION.schema, SCHEMA_COMMIT_ID)
    }).not.toThrow()
  })

  it('throws when required properties are missing', () => {
    expect(() => {
      schemaValidator.validateSchema(
        CONTENT_NO_REQ_PROPS,
        MODEL_DEFINITION.schema,
        SCHEMA_COMMIT_ID
      )
    }).toThrow(
      /data must have required property 'arrayProperty', data must have required property 'stringArrayProperty', data must have required property 'stringProperty', data must have required property 'intProperty', data must have required property 'floatProperty'/
    )
  })

  it('throws when min values requirements are not respected', () => {
    expect(() => {
      schemaValidator.validateSchema(
        CONTENT_MINS_NOT_RESPECTED,
        MODEL_DEFINITION.schema,
        SCHEMA_COMMIT_ID
      )
    }).toThrow(
      /data\/arrayProperty must NOT have fewer than 2 items, data\/stringArrayProperty\/0 must NOT have fewer than 2 characters, data\/stringProperty must NOT have fewer than 3 characters, data\/intProperty must be >= 2, data\/floatProperty must be >= 3/
    )
  })

  it('throws when max values requirements are not respected', () => {
    expect(() => {
      schemaValidator.validateSchema(
        CONTENT_MAXS_NOT_RESPECTED,
        MODEL_DEFINITION.schema,
        SCHEMA_COMMIT_ID
      )
    }).toThrow(
      /data\/arrayProperty must NOT have more than 4 items, data\/stringArrayProperty\/0 must NOT have more than 6 characters, data\/stringProperty must NOT have more than 8 characters, data\/intProperty must be <= 100, data\/floatProperty must be <= 110/
    )
  })

  it('throws when additional values are given', () => {
    expect(() => {
      schemaValidator.validateSchema(
        CONTENT_WITH_ADDITIONAL_PROPERTY,
        MODEL_DEFINITION.schema,
        SCHEMA_COMMIT_ID
      )
    }).toThrow(/data must NOT have additional properties/)
  })
})
