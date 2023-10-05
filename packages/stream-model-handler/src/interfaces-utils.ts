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

export type Resolvers = {
  expected: (schema: Schema) => Schema | null
  implemented: (schema: Schema) => Schema | null
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

export function isValidArraySchema(
  expected: JSONSchema.Array,
  implemented: JSONSchema.Array,
  resolve: Resolvers
): boolean {
  // items schema must be defined
  if (expected.items == null || implemented.items == null) {
    return false
  }
  // maxItems implementation must be at least as restrictive as expected
  if (
    expected.maxItems != null &&
    (implemented.maxItems == null || implemented.maxItems > expected.maxItems)
  ) {
    return false
  }
  // minItems implementation must be at least as restrictive as expected
  if (
    expected.minItems != null &&
    (implemented.minItems == null || implemented.minItems < expected.minItems)
  ) {
    return false
  }

  // Resolve item schemas and validate them
  const resolvedExpected = resolve.expected(expected.items as Schema)
  const resolvedImplemented = resolve.implemented(implemented.items as Schema)
  if (resolvedExpected == null || resolvedImplemented == null) {
    return false
  }
  return isValidSchemaType(resolvedExpected, resolvedImplemented, resolve)
}

export function isValidObjectSchema(
  expected: JSONSchema.Object,
  implemented: JSONSchema.Object,
  resolve: Resolvers
): boolean {
  // Check than all properties required by the interface are implemented
  const implementedRequired = implemented.required ?? []
  for (const required of expected.required ?? []) {
    if (!implementedRequired.includes(required)) {
      return false
    }
  }

  // Check if there is any expected property to validate
  const expectedProperties = Object.entries(expected.properties ?? {})
  if (expectedProperties.length === 0) {
    return true
  }

  const implementedProperties = implemented.properties ?? {}
  for (const [key, expectedValue] of expectedProperties) {
    const implementedValue = implementedProperties[key]
    if (implementedValue == null) {
      // Missing expected property from the implementation
      return false
    }

    const resolvedExpected = resolve.expected(expectedValue as Schema)
    const resolvedImplemented = resolve.implemented(implementedValue as Schema)
    const isValidProperty = isValidSchemaType(resolvedExpected, resolvedImplemented, resolve)
    if (!isValidProperty) {
      return false
    }
  }

  return true
}

export function isValidNumberSchema(
  expected: JSONSchema.Number,
  implemented: JSONSchema.Number
): boolean {
  // constant value must be the same
  if (expected.const != null && implemented.const !== expected.const) {
    return false
  }
  // maximum value implementation must be at least as restrictive as expected
  if (expected.maximum != null) {
    if (implemented.const != null) {
      if (implemented.const > expected.maximum) {
        return false
      }
    } else if (implemented.maximum == null || implemented.maximum > expected.maximum) {
      return false
    }
  }
  // minimum value implementation must be at least as restrictive as expected
  if (expected.minimum != null) {
    if (implemented.const != null) {
      if (implemented.const < expected.minimum) {
        return false
      }
    } else if (implemented.minimum == null || implemented.minimum < expected.minimum) {
      return false
    }
  }
  // exclusiveMaximum value implementation must be at least as restrictive as expected
  if (expected.exclusiveMaximum != null) {
    if (implemented.const != null) {
      if (implemented.const >= expected.exclusiveMaximum) {
        return false
      }
    } else if (
      implemented.exclusiveMaximum == null ||
      implemented.exclusiveMaximum > expected.exclusiveMaximum
    ) {
      return false
    }
  }
  // exclusiveMinimum value implementation must be at least as restrictive as expected
  if (expected.exclusiveMinimum != null) {
    if (implemented.const != null) {
      if (implemented.const <= expected.exclusiveMinimum) {
        return false
      }
    } else if (
      implemented.exclusiveMinimum == null ||
      implemented.exclusiveMinimum < expected.exclusiveMinimum
    ) {
      return false
    }
  }
  return true
}

export function isValidStringSchema(
  expected: JSONSchema.String,
  implemented: JSONSchema.String
): boolean {
  // constant value must be the same
  if (expected.const != null && implemented.const !== expected.const) {
    return false
  }
  // pattern value must be the same
  if (expected.pattern != null && implemented.pattern !== expected.pattern) {
    return false
  }
  // maxLength value implementation must be at least as restrictive as expected
  if (expected.maxLength != null) {
    if (implemented.const != null) {
      if (implemented.const.length > expected.maxLength) {
        return false
      }
    } else if (implemented.maxLength == null || implemented.maxLength > expected.maxLength) {
      return false
    }
  }
  // minLength value implementation must be at least as restrictive as expected
  if (expected.minLength != null) {
    if (implemented.const != null) {
      if (implemented.const.length < expected.minLength) {
        return false
      }
    } else if (implemented.minLength == null || implemented.minLength < expected.minLength) {
      return false
    }
  }
  return true
}

export function areMatchingSchemaTypes(
  expectedList: Array<JSONSchema> | ReadonlyArray<JSONSchema>,
  implementedList: Array<JSONSchema> | ReadonlyArray<JSONSchema>,
  resolve: Resolvers
): boolean {
  // Expect strict match of items
  if (implementedList.length !== expectedList.length) {
    return false
  }
  expectedLoop: for (const expected of expectedList) {
    for (const implemented of implementedList) {
      if (isValidSchemaType(expected, implemented, resolve)) {
        // Match found, move to next expected item
        continue expectedLoop
      }
    }
    // No implementation found
    return false
  }
  return true
}

export function isValidSchemaType(
  expected: JSONSchema,
  implemented: JSONSchema,
  resolve: Resolvers
): boolean {
  // Check boolean schemas
  if (typeof expected === 'boolean') {
    return implemented === expected
  }
  if (typeof implemented === 'boolean') {
    return false
  }

  // type must match
  if (implemented.type !== expected.type) {
    return false
  }
  // title must match when provided
  if (expected.title != null && implemented.title !== expected.title) {
    return false
  }

  // check matching subschemas
  if (Array.isArray(expected.allOf)) {
    return Array.isArray(implemented.allOf)
      ? areMatchingSchemaTypes(expected.allOf, implemented.allOf, resolve)
      : false
  }
  if (Array.isArray(expected.anyOf)) {
    return Array.isArray(implemented.anyOf)
      ? areMatchingSchemaTypes(expected.anyOf, implemented.anyOf, resolve)
      : false
  }
  if (Array.isArray(expected.oneOf)) {
    return Array.isArray(implemented.oneOf)
      ? areMatchingSchemaTypes(expected.oneOf, implemented.oneOf, resolve)
      : false
  }

  switch (expected.type) {
    case 'array': {
      return isValidArraySchema(
        expected as JSONSchema.Array,
        implemented as JSONSchema.Array,
        resolve
      )
    }
    case 'object': {
      return isValidObjectSchema(
        expected as JSONSchema.Object,
        implemented as JSONSchema.Object,
        resolve
      )
    }
    case 'integer':
    case 'number': {
      return isValidNumberSchema(expected as JSONSchema.Number, implemented as JSONSchema.Number)
    }
    case 'string': {
      return isValidStringSchema(expected as JSONSchema.String, implemented as JSONSchema.String)
    }
    case 'boolean':
    case 'null':
      return true
    default:
      throw new Error(`Unsupported schema type: ${expected.type}`)
  }
}

export function createResolvers(
  expected: JSONSchema.Object,
  implemented: JSONSchema.Object
): Resolvers {
  return {
    expected: (schema: Schema) => resolveReference(schema, expected),
    implemented: (schema: Schema) => resolveReference(schema, implemented),
  }
}

export function isValidSchemaImplementation(
  expected: JSONSchema.Object,
  implemented: JSONSchema.Object
): boolean {
  // Resolve references from the root schema object
  const resolvers = createResolvers(expected, implemented)
  return isValidSchemaType(expected, implemented, resolvers)
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
  if (!isValidSchemaImplementation(expected.schema, implemented.schema)) {
    throw new Error(`Invalid schema implementation of interface ${interfaceID}`)
  }
  if (!isValidRelationsImplementation(expected.relations, implemented.relations)) {
    throw new Error(`Invalid relations implementation of interface ${interfaceID}`)
  }
  if (!isValidViewsImplementation(expected.views, implemented.views)) {
    throw new Error(`Invalid views implementation of interface ${interfaceID}`)
  }
}

export async function validateImplementedInterfaces(
  model: ModelDefinition,
  context: Context
): Promise<void> {
  const toValidate = ((model as ModelDefinitionV2).implements ?? []).map(async (interfaceID) => {
    const interfaceModel = await Model.load(context.api, interfaceID)
    return validateInterfaceImplementation(interfaceID, interfaceModel.content, model)
  })
  await Promise.all(toValidate)
}
