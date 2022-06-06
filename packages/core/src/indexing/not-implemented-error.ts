/**
 * Helps to track what we have to implement in the near future.
 */
export class NotImplementedError extends Error {
  constructor(name: string) {
    super(`NOT IMPLEMENTED: ${name}`)
  }
}
