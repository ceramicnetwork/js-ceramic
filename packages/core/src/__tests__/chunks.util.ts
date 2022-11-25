/**
 * Split +array+ into chunks of certain +size+.
 */
export function chunks<A>(array: Array<A>, size: number): Array<Array<A>> {
  const results: Array<Array<A>> = []
  for (let i = 0; i < array.length; i += size) {
    results.push(array.slice(i, i + size))
  }
  return results
}
