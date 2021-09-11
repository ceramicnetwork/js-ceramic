declare module 'multibase' {
  export function encode(base: string, payload: Uint8Array): Uint8Array
  export function decode(val: string): Uint8Array
  export function isEncoded(bytes: Uint8Array | string): string
}
