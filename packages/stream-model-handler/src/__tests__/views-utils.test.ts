import type { JSONSchema } from 'json-schema-typed/draft-2020-12'
import { ViewsValidation } from '../views-utils.js'
import { ModelViewsDefinition } from '@ceramicnetwork/stream-model'

const SCHEMA: JSONSchema.Object = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    stringPropName: {
      type: 'string',
      maxLength: 80,
    },
  },
  additionalProperties: false,
  required: ['stringPropName'],
}

const VIEWS_VALID: ModelViewsDefinition = {
  owner: { type: 'documentAccount' },
  version: { type: 'documentVersion' },
}

const VIEWS_INVALID_TYPE: ModelViewsDefinition = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  owner: { type: 'invalidType' },
}

const VIEWS_DUPLICATED_PROPERTY: ModelViewsDefinition = {
  stringPropName: { type: 'documentAccount' },
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

  it('throws with property name duplicated from schema', async () => {
    expect(() => {
      viewsValidator.validateViews(VIEWS_DUPLICATED_PROPERTY, SCHEMA)
    }).toThrow(/view definition used with a property also present in schema/)
  })
})
