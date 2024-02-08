import { test, jest, expect, describe } from '@jest/globals'
import { ProcessingLoop, Deferred } from '../processing-loop.js'
import { LoggerProvider } from '@ceramicnetwork/common'

async function* infiniteIntegers(batchSize = 2) {
  let n = 0
  while (true) {
    const toYield: Array<number> = []
    for (let i = 0; i < batchSize; i++) {
      toYield.push(n++)
    }
    yield toYield
  }
}

const logger = new LoggerProvider().getDiagnosticsLogger()

describe('deferred', () => {
  test('resolve', async () => {
    const deferred = new Deferred<string>()
    deferred.resolve('hello')
    await expect(deferred).resolves.toEqual('hello')
  })
  test('reject', async () => {
    const deferred = new Deferred<string>()
    deferred.reject(new Error(`farewell`))
    await expect(deferred).rejects.toThrow(/farewell/)
  })
})

test('do not call next on construction', async () => {
  const generator = infiniteIntegers()
  const nextSpy = jest.spyOn(generator, 'next')
  new ProcessingLoop(logger, generator, () => Promise.resolve())
  expect(nextSpy).not.toBeCalled()
})

test('process entries one by one, stop when all processed', async () => {
  const isDone = new Deferred()
  const max = 10
  let n = 0
  async function* finiteIntegers() {
    while (n < max) {
      yield [n++, n++]
    }
    isDone.resolve()
  }
  const noopHandler = jest.fn(() => Promise.resolve())
  const loop = new ProcessingLoop(logger, finiteIntegers(), noopHandler)
  loop.start()
  await isDone
  expect(noopHandler).toBeCalledTimes(n)
})

test('stop generator after processing (idempotent)', async () => {
  const isDone = new Deferred()
  const max = 10
  let n = 0
  async function* finiteIntegers() {
    while (n < max) {
      yield [n++, n++]
    }
    isDone.resolve()
  }
  const source = finiteIntegers()
  const returnSpy = jest.spyOn(source, 'return')
  const noop = jest.fn(() => Promise.resolve())
  const loop = new ProcessingLoop(logger, source, noop)
  loop.start()
  await isDone
  expect(returnSpy).not.toBeCalled()
  await loop.stop()
  expect(returnSpy).toBeCalled()
})

test('stop generator', async () => {
  const source = infiniteIntegers()
  const returnSpy = jest.spyOn(source, 'return')
  const noop = jest.fn(() => Promise.resolve())
  const loop = new ProcessingLoop(logger, source, noop)
  loop.start()
  expect(returnSpy).not.toBeCalled()
  await loop.stop()
  expect(returnSpy).toBeCalled()
})

test('pass error to .stop', async () => {
  const source = infiniteIntegers()
  const returnSpy = jest.spyOn(source, 'return')
  const defer = new Deferred()
  const noop = async (n: number) => {
    if (n >= 10) {
      defer.resolve()
      throw new Error(`Valhalla welcomes you`)
    }
  }
  const loop = new ProcessingLoop(logger, source, noop)
  loop.start()
  await defer
  expect(returnSpy).not.toBeCalled()
  await expect(loop.stop()).rejects.toThrow(/Valhalla/)
  expect(returnSpy).toBeCalled()
})
