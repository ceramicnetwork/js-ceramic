export class ReIndexedModelError extends Error {
  constructor(modelStreamID: string) {
    super(`Cannot re-index model ${modelStreamID}`)
  }
}
