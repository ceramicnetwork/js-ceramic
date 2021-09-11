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
