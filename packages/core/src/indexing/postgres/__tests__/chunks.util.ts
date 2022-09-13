export function chunks<T>(array: Array<T>, chunkSize: number): Array<Array<T>> {
  const result = new Array<Array<T>>()
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize))
  }
  return result
}
