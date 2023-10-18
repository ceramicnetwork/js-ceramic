function swallowError() {
  // Do Nothing
}

/**
 * Mark that we are not interested in `promise` result. If `promise` rejects, we swallow the error.
 */
export function doNotWait(promise: Promise<any>): void {
  promise.catch(swallowError)
}
