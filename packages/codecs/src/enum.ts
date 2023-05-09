import { Type, identity } from 'codeco'

/**
 * codeco codec for enums
 * @param enumName - name of the codec
 * @param theEnum - TS enum to pass
 */
export function enumCodec<EnumType>(enumName: string, theEnum: Record<string, string | number>) {
  const isEnumValue = (input: unknown): input is EnumType =>
    Object.values<unknown>(theEnum).includes(input)

  return new Type<EnumType>(
    enumName,
    isEnumValue,
    (input, context) => (isEnumValue(input) ? context.success(input) : context.failure()),
    identity
  )
}
export { enumCodec as enum }
