import type { JSONSchema } from 'json-schema-typed/draft-2020-12'
import { ModelViewsDefinition } from '@ceramicnetwork/stream-model'

const SUPPORTED_VIEW_TYPES = [
  'documentAccount'
]

export class ViewsValidation {
  public validateViews(
    views: ModelViewsDefinition,
    schema: JSONSchema.Object
  ) {
    Object.entries(views).map(([key, value]) => {
      if (!SUPPORTED_VIEW_TYPES.includes(value.type)) {
        throw new Error('unsupported model view definition type')
      }
      const referredProp = schema.properties[key]
      if (referredProp === undefined) {
        throw new Error('model view definition refers to a missing property')
      }
      if (value.type === 'documentAccount' && referredProp['title'] !== 'GraphQLDID') {
        throw new Error('documentAccount has to be used with a DID property')
      }
    })
  }
}
