import type { JSONSchema } from 'json-schema-typed/draft-2020-12'
import { ViewsValidation } from '../views-utils'
import { ModelViewsDefinition } from '@ceramicnetwork/stream-model'

const SCHEMA: JSONSchema.Object = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: 'object',
  properties: {
    owner: {
      "maxLength": 80,
      "pattern": "/^did:[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+:[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/",
      "title": "GraphQLDID",
      "type": "string",
    },
    stringPropName: {
      type: 'string',
      maxLength: 80,
    },
  },
  additionalProperties: false,
  required: ['owner', 'stringPropName'],
}

const VIEWS_VALID: ModelViewsDefinition = {
  'owner': { type: 'documentAccount' }
}

const VIEWS_INVALID_TYPE: ModelViewsDefinition = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  'owner': { type: 'invalidType' }
}

const VIEWS_INVALID_PROPERTY: ModelViewsDefinition = {
  'stringPropName': { type: 'documentAccount' }
}

const VIEWS_INVALID_MISSING_PROPERTY: ModelViewsDefinition = {
  'missingProperty': { type: 'documentAccount' }
}

describe('ViewsValidation', () => {
  let viewsValidator: ViewsValidation

  beforeAll(async () => {
    viewsValidator = new ViewsValidation()
  })

  it('validates correct views', async () => {
    expect(() => {
      viewsValidator.validateViews(VIEWS_VALID, SCHEMA)
    }).not.toThrow()
  })

  it('throws with invalid model view type', async () => {
    expect(() => {
      viewsValidator.validateViews(VIEWS_INVALID_TYPE, SCHEMA)
    }).toThrow(/unsupported model view definition type/)
  })

  it('throws with invalid target property for a documentAccount view', async () => {
    expect(() => {
      viewsValidator.validateViews(VIEWS_INVALID_PROPERTY, SCHEMA)
    }).toThrow(/documentAccount has to be used with a DID property/)
  })

  it('throws with missing target property', async () => {
    expect(() => {
      viewsValidator.validateViews(VIEWS_INVALID_MISSING_PROPERTY, SCHEMA)
    }).toThrow(/model view definition refers to a missing property/)
  })
})

