export function asyncIterableFromArray<A>(array: Array<A>): AsyncIterable<A> {
  return {
    [Symbol.asyncIterator](): any {
      let index = 0
      return {
        next(): any {
          if (index === array.length) {
            return Promise.resolve({ value: null, done: true })
          }
          return Promise.resolve({ value: array[index++], done: false })
        },
      }
    },
  }
}
