import { JsonReference } from 'json-ptr'
import type { JSONSchema } from 'json-schema-typed/draft-2020-12'

type FieldSchema = Exclude<JSONSchema, boolean>

const SUPPORTED_FIELD_TYPES = ['boolean', 'integer', 'number', 'string']

export function validateSetFields(fields: Array<string>, modelSchema: JSONSchema.Object): void {
  if (fields.length === 0) {
    throw new Error(`At least one field must be defined for the SET account relation`)
  }

  const requiredFields = modelSchema.required ?? []

  const errors: Array<Error> = []
  for (const field of fields) {
    let fieldSchema = modelSchema.properties[field] as FieldSchema | undefined
    if (fieldSchema?.$ref != null) {
      const ref = new JsonReference(fieldSchema.$ref)
      fieldSchema = ref.resolve(modelSchema)
    }
    if (fieldSchema == null) {
      errors.push(new Error(`Field not found in schema: ${field}`))
    } else {
      const fieldType = fieldSchema.type
      if (fieldType == null) {
        errors.push(new Error(`Missing type for field: ${field}`))
      } else if (!SUPPORTED_FIELD_TYPES.includes(fieldType as string)) {
        errors.push(
          new Error(
            `Unsupported type ${fieldType} for field ${field} set in the account relation, only the following types are supported: ${SUPPORTED_FIELD_TYPES.join(
              ', '
            )}`
          )
        )
      }
      if (!requiredFields.includes(field)) {
        errors.push(
          new Error(`Field ${field} must be required to be used for the SET account relation`)
        )
      }
    }
  }

  if (errors.length) {
    throw new AggregateError(errors, 'Invalid schema fields for SET account relation')
  }
}
