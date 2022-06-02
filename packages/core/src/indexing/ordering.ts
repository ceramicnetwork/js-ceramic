export enum Ordering {
  CHRONOLOGICAL = 'chronological', // last_anchored_at DESC NULLS FIRST, created_at DESC
  INSERTION = 'insertion', // created_at DESC = when an entry was added to the index
}

export class UnsupportedOrderingError extends Error {
  constructor(ordering: never) {
    super(`Unsupported ordering: ${ordering}`)
  }
}
