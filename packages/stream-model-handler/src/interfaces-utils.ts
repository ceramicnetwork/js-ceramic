import type { Context } from '@ceramicnetwork/common'
import {
  Model,
  type ModelDefinition,
  type ModelDefinitionV2,
  type ModelRelationsDefinitionV2,
  type ModelViewsDefinitionV2,
} from '@ceramicnetwork/stream-model'
import { JsonReference } from 'json-ptr'
import type { JSONSchema } from 'json-schema-typed/draft-2020-12'
import isMatch from 'lodash.ismatch'

export type Schema = Exclude<JSONSchema, boolean>

export type ValidationErrorData = {
  path: Array<string>
  property?: string
  index?: number
  expected: unknown
  actual?: unknown
}

export function getErrorMessage(data: ValidationErrorData): string {
  const path = data.path.join('.')
  const target = data.property
    ? `property "${data.property}" of "${path}"`
    : data.index
    ? `index ${data.index} of "${path}"`
    : path
  const actual = data.actual ? String(data.actual) : 'no value'
  return `Invalid value for ${target}: expected ${String(data.expected)} but got ${actual}`
}

export class ValidationError extends Error implements ValidationErrorData {
  path: Array<string>
  property?: string
  index?: number
  expected: unknown
  actual: unknown

  constructor(data: ValidationErrorData, message?: string) {
    super(message ?? getErrorMessage(data))
    this.path = data.path
    this.property = data.property
    this.index = data.index
    this.expected = data.expected
    this.actual = data.actual
  }
}

export type Resolvers = {
  resolveExpected: (schema: Schema) => Schema | null
  resolveImplemented: (schema: Schema) => Schema | null
}

export type ValidationContext = Resolvers & {
  path: Array<string>
}

export function childContext(ctx: ValidationContext, key: string): ValidationContext {
  return { ...ctx, path: [...ctx.path, key] }
}

export function resolveReference(childSchema: Schema, parentSchema: Schema): Schema | null {
  let schema = childSchema
  if (childSchema.$ref != null) {
    const ref = new JsonReference(childSchema.$ref)
    schema = ref.resolve(parentSchema)
  }
  return schema ?? null
}

export function validateInterface(model: ModelDefinition) {
  if (
    Object.keys(model.schema?.properties ?? {}).length === 0 &&
    Object.keys(model.views ?? {}).length === 0
  ) {
    throw new Error('Invalid interface: a least one propery or view must be present')
  }
}

export function validateArraySchema(
  context: ValidationContext,
  expected: JSONSchema.Array,
  implemented: JSONSchema.Array
): Array<ValidationErrorData> {
  const errors: Array<ValidationErrorData> = []

  // maxItems implementation must be at least as restrictive as expected
  if (
    expected.maxItems != null &&
    (implemented.maxItems == null || implemented.maxItems > expected.maxItems)
  ) {
    errors.push({
      path: context.path,
      property: 'maxItems',
      expected: expected.maxItems,
      actual: implemented.maxItems,
    })
  }

  // minItems implementation must be at least as restrictive as expected
  if (
    expected.minItems != null &&
    (implemented.minItems == null || implemented.minItems < expected.minItems)
  ) {
    errors.push({
      path: context.path,
      property: 'minItems',
      expected: expected.minItems,
      actual: implemented.minItems,
    })
  }

  // items schema must be defined
  if (expected.items == null || implemented.items == null) {
    errors.push({
      path: context.path,
      property: 'items',
      expected: expected.items,
      actual: implemented.items,
    })
  } else {
    // Resolve item schemas and validate them
    const resolvedExpected = context.resolveExpected(expected.items as Schema)
    const resolvedImplemented = context.resolveImplemented(implemented.items as Schema)
    if (resolvedExpected == null || resolvedImplemented == null) {
      errors.push({
        path: context.path,
        property: 'items',
        expected: resolvedExpected,
        actual: resolvedImplemented,
      })
    } else {
      return errors.concat(
        validateSchemaType(childContext(context, 'items'), resolvedExpected, resolvedImplemented)
      )
    }
  }

  return errors
}

export function validateBooleanSchema(
  context: ValidationContext,
  expected: JSONSchema.Boolean,
  implemented: JSONSchema.Boolean
): Array<ValidationErrorData> {
  // constant value must be the same
  if (expected.const != null && implemented.const !== expected.const) {
    return [
      {
        path: context.path,
        property: 'const',
        expected: expected.const,
        actual: implemented.const,
      },
    ]
  }

  return []
}

export function validateObjectSchema(
  context: ValidationContext,
  expected: JSONSchema.Object,
  implemented: JSONSchema.Object
): Array<ValidationErrorData> {
  let errors: Array<ValidationErrorData> = []

  // Check than all properties required by the interface are implemented
  const implementedRequired = implemented.required ?? []
  for (const required of expected.required ?? []) {
    if (!implementedRequired.includes(required)) {
      errors.push({ path: context.path, property: 'required', expected: required })
    }
  }

  const implementedProperties = implemented.properties ?? {}
  for (const [key, expectedValue] of Object.entries(expected.properties ?? {})) {
    const implementedValue = implementedProperties[key]
    if (implementedValue == null) {
      // Missing expected property from the implementation
      errors.push({ path: context.path, property: 'properties', expected: key })
    } else {
      const resolvedExpected = context.resolveExpected(expectedValue as Schema)
      const resolvedImplemented = context.resolveImplemented(implementedValue as Schema)
      const propertyErrors = validateSchemaType(
        childContext(context, key),
        resolvedExpected,
        resolvedImplemented
      )
      errors = errors.concat(propertyErrors)
    }
  }

  return errors
}

export function validateNumberSchema(
  context: ValidationContext,
  expected: JSONSchema.Number,
  implemented: JSONSchema.Number
): Array<ValidationErrorData> {
  const errors: Array<ValidationErrorData> = []

  // constant value must be the same
  if (expected.const != null && implemented.const !== expected.const) {
    errors.push({
      path: context.path,
      property: 'const',
      expected: expected.const,
      actual: implemented.const,
    })
  }

  // maximum value implementation must be at least as restrictive as expected
  if (expected.maximum != null) {
    if (implemented.const != null) {
      if (implemented.const > expected.maximum) {
        errors.push({
          path: context.path,
          property: 'maximum',
          expected: expected.maximum,
          actual: implemented.const,
        })
      }
    } else if (implemented.maximum == null || implemented.maximum > expected.maximum) {
      errors.push({
        path: context.path,
        property: 'maximum',
        expected: expected.maximum,
        actual: implemented.maximum,
      })
    }
  }

  // minimum value implementation must be at least as restrictive as expected
  if (expected.minimum != null) {
    if (implemented.const != null) {
      if (implemented.const < expected.minimum) {
        errors.push({
          path: context.path,
          property: 'minimum',
          expected: expected.minimum,
          actual: implemented.const,
        })
      }
    } else if (implemented.minimum == null || implemented.minimum < expected.minimum) {
      errors.push({
        path: context.path,
        property: 'minimum',
        expected: expected.minimum,
        actual: implemented.minimum,
      })
    }
  }

  // exclusiveMaximum value implementation must be at least as restrictive as expected
  if (expected.exclusiveMaximum != null) {
    if (implemented.const != null) {
      if (implemented.const >= expected.exclusiveMaximum) {
        errors.push({
          path: context.path,
          property: 'exclusiveMaximum',
          expected: expected.exclusiveMaximum,
          actual: implemented.const,
        })
      }
    } else if (
      implemented.exclusiveMaximum == null ||
      implemented.exclusiveMaximum > expected.exclusiveMaximum
    ) {
      errors.push({
        path: context.path,
        property: 'exclusiveMaximum',
        expected: expected.exclusiveMaximum,
        actual: implemented.exclusiveMaximum,
      })
    }
  }

  // exclusiveMinimum value implementation must be at least as restrictive as expected
  if (expected.exclusiveMinimum != null) {
    if (implemented.const != null) {
      if (implemented.const <= expected.exclusiveMinimum) {
        errors.push({
          path: context.path,
          property: 'exclusiveMinimum',
          expected: expected.exclusiveMinimum,
          actual: implemented.const,
        })
      }
    } else if (
      implemented.exclusiveMinimum == null ||
      implemented.exclusiveMinimum < expected.exclusiveMinimum
    ) {
      errors.push({
        path: context.path,
        property: 'exclusiveMinimum',
        expected: expected.exclusiveMinimum,
        actual: implemented.exclusiveMinimum,
      })
    }
  }

  return errors
}

export function validateStringSchema(
  context: ValidationContext,
  expected: JSONSchema.String,
  implemented: JSONSchema.String
): Array<ValidationErrorData> {
  const errors: Array<ValidationErrorData> = []

  // constant value must be the same
  if (expected.const != null && implemented.const !== expected.const) {
    errors.push({
      path: context.path,
      property: 'const',
      expected: expected.const,
      actual: implemented.const,
    })
  }

  // pattern value must be the same
  if (expected.pattern != null && implemented.pattern !== expected.pattern) {
    errors.push({
      path: context.path,
      property: 'pattern',
      expected: expected.pattern,
      actual: implemented.pattern,
    })
  }
  // maxLength value implementation must be at least as restrictive as expected
  if (expected.maxLength != null) {
    if (implemented.const != null) {
      if (implemented.const.length > expected.maxLength) {
        errors.push({
          path: context.path,
          property: 'maxLength',
          expected: expected.maxLength,
          actual: implemented.const,
        })
      }
    } else if (implemented.maxLength == null || implemented.maxLength > expected.maxLength) {
      errors.push({
        path: context.path,
        property: 'maxLength',
        expected: expected.maxLength,
        actual: implemented.maxLength,
      })
    }
  }
  // minLength value implementation must be at least as restrictive as expected
  if (expected.minLength != null) {
    if (implemented.const != null) {
      if (implemented.const.length < expected.minLength) {
        errors.push({
          path: context.path,
          property: 'minLength',
          expected: expected.minLength,
          actual: implemented.const,
        })
      }
    } else if (implemented.minLength == null || implemented.minLength < expected.minLength) {
      errors.push({
        path: context.path,
        property: 'minLength',
        expected: expected.minLength,
        actual: implemented.minLength,
      })
    }
  }

  return errors
}

export function validateAllSchemaTypes(
  context: ValidationContext,
  expectedList: Array<JSONSchema> | ReadonlyArray<JSONSchema>,
  implementedList: Array<JSONSchema> | ReadonlyArray<JSONSchema>
): Array<ValidationErrorData> {
  // Expect strict match of items
  if (implementedList.length !== expectedList.length) {
    return [
      {
        path: context.path,
        property: 'length',
        expected: expectedList.length,
        actual: implementedList.length,
      },
    ]
  }

  const errors: Array<ValidationErrorData> = []

  expectedLoop: for (const [index, expected] of expectedList.entries()) {
    for (const implemented of implementedList) {
      const matchErrors = validateSchemaType(context, expected, implemented)
      if (matchErrors.length === 0) {
        // Match found, move to next expected item
        continue expectedLoop
      }
    }
    // No implementation found
    errors.push({ path: context.path, index, expected })
  }

  return errors
}

export function validateAnySchemaTypes(
  context: ValidationContext,
  expectedList: Array<JSONSchema> | ReadonlyArray<JSONSchema>,
  implementedList: Array<JSONSchema> | ReadonlyArray<JSONSchema>
): Array<ValidationErrorData> {
  const errors: Array<ValidationErrorData> = []

  for (const [index, expected] of expectedList.entries()) {
    for (const implemented of implementedList) {
      const matchErrors = validateSchemaType(context, expected, implemented)
      if (matchErrors.length === 0) {
        // Match found, return as valid
        return []
      }
    }
    // No implementation found
    errors.push({ path: context.path, index, expected })
  }

  return errors
}

export function validateSchemaType(
  context: ValidationContext,
  expected: JSONSchema,
  implemented: JSONSchema
): Array<ValidationErrorData> {
  // Check boolean schemas
  if (typeof expected === 'boolean') {
    return implemented === expected ? [] : [{ path: context.path, expected, actual: implemented }]
  } else if (typeof implemented === 'boolean') {
    return [{ path: context.path, expected, actual: implemented }]
  }

  let errors: Array<ValidationErrorData> = []

  // title must match when provided
  if (expected.title != null && implemented.title !== expected.title) {
    errors.push({
      path: context.path,
      property: 'title',
      expected: expected.title,
      actual: implemented.title,
    })
  }

  // check matching subschemas
  if (Array.isArray(expected.allOf)) {
    if (Array.isArray(implemented.allOf)) {
      const allOfErrors = validateAllSchemaTypes(
        childContext(context, 'allOf'),
        expected.allOf,
        implemented.allOf
      )
      errors = errors.concat(allOfErrors)
    } else {
      errors.push({
        path: context.path,
        property: 'allOf',
        expected: expected.allOf,
        actual: implemented.allOf,
      })
    }
  } else if (Array.isArray(expected.anyOf)) {
    const anyOfErrors = validateAnySchemaTypes(
      childContext(context, 'anyOf'),
      expected.anyOf,
      Array.isArray(implemented.anyOf) ? implemented.anyOf : [implemented]
    )
    errors = errors.concat(anyOfErrors)
  } else if (Array.isArray(expected.oneOf)) {
    if (Array.isArray(implemented.oneOf)) {
      const oneOfErrors = validateAllSchemaTypes(
        childContext(context, 'oneOf'),
        expected.oneOf,
        implemented.oneOf
      )
      errors = errors.concat(oneOfErrors)
    } else {
      errors.push({
        path: context.path,
        property: 'oneOf',
        expected: expected.oneOf,
        actual: implemented.oneOf,
      })
    }
  } else if (implemented.type !== expected.type) {
    errors.push({
      path: context.path,
      property: 'type',
      expected: expected.type,
      actual: implemented.type,
    })
  } else {
    let schemaTypeErrors: Array<ValidationErrorData> = []
    switch (expected.type) {
      case 'array': {
        schemaTypeErrors = validateArraySchema(
          context,
          expected as JSONSchema.Array,
          implemented as JSONSchema.Array
        )
        break
      }
      case 'object': {
        schemaTypeErrors = validateObjectSchema(
          context,
          expected as JSONSchema.Object,
          implemented as JSONSchema.Object
        )
        break
      }
      case 'integer':
      case 'number': {
        schemaTypeErrors = validateNumberSchema(
          context,
          expected as JSONSchema.Number,
          implemented as JSONSchema.Number
        )
        break
      }
      case 'string': {
        schemaTypeErrors = validateStringSchema(
          context,
          expected as JSONSchema.String,
          implemented as JSONSchema.String
        )
        break
      }
      case 'boolean':
        schemaTypeErrors = validateBooleanSchema(
          context,
          expected as JSONSchema.Boolean,
          implemented as JSONSchema.Boolean
        )
        break
      case 'null':
        break
      default:
        throw new Error(`Unsupported schema type: ${expected.type}`)
    }
    return errors.concat(schemaTypeErrors)
  }

  return errors
}

export function createResolvers(
  expected: JSONSchema.Object,
  implemented: JSONSchema.Object
): Resolvers {
  return {
    resolveExpected: (schema: Schema) => resolveReference(schema, expected),
    resolveImplemented: (schema: Schema) => resolveReference(schema, implemented),
  }
}

export function validateSchemaImplementation(
  expected: JSONSchema.Object,
  implemented: JSONSchema.Object
): Array<ValidationErrorData> {
  // Resolve references from the root schema object
  const resolvers = createResolvers(expected, implemented)
  return validateSchemaType({ ...resolvers, path: [] }, expected, implemented)
}

export function isValidRelationsImplementation(
  expected: ModelRelationsDefinitionV2 = {},
  implemented: ModelRelationsDefinitionV2 = {}
): boolean {
  return isMatch(implemented, expected)
}

export function isValidViewsImplementation(
  expected: ModelViewsDefinitionV2 = {},
  implemented: ModelViewsDefinitionV2 = {}
): boolean {
  return isMatch(implemented, expected)
}

export function validateInterfaceImplementation(
  interfaceID: string,
  expected: ModelDefinition,
  implemented: ModelDefinition
): void {
  const errors: Array<Error> = []

  const schemaErrors = validateSchemaImplementation(expected.schema, implemented.schema)
  if (schemaErrors.length) {
    errors.push(
      new AggregateError(
        schemaErrors.map((data) => new ValidationError(data)),
        `Invalid schema implementation of interface ${interfaceID}`
      )
    )
  }
  if (!isValidRelationsImplementation(expected.relations, implemented.relations)) {
    errors.push(new Error(`Invalid relations implementation of interface ${interfaceID}`))
  }
  if (!isValidViewsImplementation(expected.views, implemented.views)) {
    errors.push(new Error(`Invalid views implementation of interface ${interfaceID}`))
  }

  if (errors.length) {
    throw new AggregateError(errors, `Invalid implementation of interface ${interfaceID}`)
  }
}

export async function validateImplementedInterfaces(
  model: ModelDefinition,
  context: Context
): Promise<void> {
  const errors: Array<Error> = []

  const toValidate = ((model as ModelDefinitionV2).implements ?? []).map(async (interfaceID) => {
    try {
      const interfaceModel = await Model.load(context.api, interfaceID)
      validateInterfaceImplementation(interfaceID, interfaceModel.content, model)
    } catch (error) {
      errors.push(error)
    }
  })
  await Promise.all(toValidate)

  if (errors.length) {
    throw new AggregateError(errors, `Interfaces validation failed for model ${model.name}`)
  }
}
