import type { JSONSchema } from 'json-schema-typed/draft-2020-12'
import { ModelViewsDefinition } from '@ceramicnetwork/stream-model'

const SUPPORTED_VIEW_TYPES = [
  'documentAccount',
  'documentVersion',
  'relationDocument',
  'relationFrom',
  'relationCountFrom',
]

export class ViewsValidation {
  public validateViews(views: ModelViewsDefinition, schema: JSONSchema.Object): void {
    Object.entries(views).forEach(([key, value]) => {
      if (!SUPPORTED_VIEW_TYPES.includes(value.type)) {
        throw new Error('unsupported model view definition type')
      }
      if (schema.properties[key] !== undefined) {
        throw new Error('view definition used with a property also present in schema')
      }
    })
  }
}
