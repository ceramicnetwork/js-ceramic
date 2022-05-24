export class NotImplementedError extends Error {
  constructor(name: string) {
    super(`NOT IMPLEMENTED: ${name}`)
  }
}
