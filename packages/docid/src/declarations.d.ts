declare module 'uint8arrays/concat' {
    export default function concat(bs: Array<Uint8Array>): Uint8Array
}

declare module 'uint8arrays/to-string' {
    export default function toString(b: Uint8Array, enc?: string): string
}

type JSONTable = {
  [key: string]: number | undefined;
}

declare module "varint" {
  export const encode: {
    (num: number, array?: Uint8Array, offset?: number): Uint8Array;
    bytes: number;
  }
  export const decode: {
    (buf: Uint8Array, offset?: number): number;
    bytes: number;
  }
}

declare module 'multibase' {
  export function encode(base: string, payload: Uint8Array): Uint8Array
  export function decode(val: string): Uint8Array
  export function isEncoded(bytes: Uint8Array | string): string
}



