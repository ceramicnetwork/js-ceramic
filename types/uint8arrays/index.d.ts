declare module 'uint8arrays' {
    export function toString(b: Uint8Array, enc?: string): string
    export function fromString(s: string, enc?: string): Uint8Array
    export function concat(bs: Array<Uint8Array>): Uint8Array
}

declare module 'uint8arrays/concat' {
    export default function concat(bs: Array<Uint8Array>): Uint8Array
}

declare module 'uint8arrays/to-string' {
    export default function toString(b: Uint8Array, enc?: string): string
}