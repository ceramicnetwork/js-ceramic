/**
 * Ensure exhaustive matching for variants.
 */
export class UnreachableCaseError extends Error {
  constructor(variant: never, message: string) {
    super(`Unhandled ${variant}: ${message}`);
  }
}
