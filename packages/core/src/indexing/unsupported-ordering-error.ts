/**
 * Indicates unsupported variant of ordering.
 *
 * Useful for exhaustive switch statements.
 */
export class UnsupportedOrderingError extends Error {
  constructor(ordering: never) {
    super(`Unsupported ordering: ${ordering}`)
  }
}
