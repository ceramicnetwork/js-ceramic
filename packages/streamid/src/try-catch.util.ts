/**
 * Return result of `fn`. If it throws, return an Error.
 */
export function tryCatch<A>(fn: () => A): A | Error {
  try {
    return fn()
  } catch (e) {
    return e as Error
  }
}
