import type { DIDResolutionMetadata, DIDResolutionResult, WrappedResolver } from 'did-resolver'

/**
 * Represent error as DID resolution result.
 */
export const errorRepresentation = (metadata: DIDResolutionMetadata): DIDResolutionResult => {
  return {
    didResolutionMetadata: metadata,
    didDocument: null,
    didDocumentMetadata: {},
  }
}

/**
 * Report a thrown error as a DID resolution result.
 */
export const withResolutionError = (f: WrappedResolver): Promise<DIDResolutionResult> => {
  return f().catch((e) =>
    errorRepresentation({
      error: 'invalidDid',
      message: e.toString(),
    })
  )
}
