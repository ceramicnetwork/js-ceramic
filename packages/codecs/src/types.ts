// Modified version of ts-essentials `Opaque`.
// Added WithBrand interface to overcome TS issue #37888.

type StringLiteral<T> = T extends string ? (string extends T ? never : T) : never

declare const __BRAND__: unique symbol

export interface WithBrand<Token extends string> {
  [__BRAND__]: Token
}

export type Opaque<Type, Brand extends string> = Brand extends StringLiteral<Brand>
  ? Type & WithBrand<Brand>
  : never
