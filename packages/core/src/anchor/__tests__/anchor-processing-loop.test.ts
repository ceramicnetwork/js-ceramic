import { test, jest, expect, describe } from '@jest/globals'
import { ProcessingLoop, Deferred } from '../processing-loop.js'
import { LoggerProvider } from '@ceramicnetwork/common'

async function* infiniteIntegers() {
  let n = 0
  while (true) {
    yield n++
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
  new ProcessingLoop(logger, 1, generator, () => Promise.resolve())
  expect(nextSpy).not.toBeCalled()
})

test('process entries one by one, stop when all processed', async () => {
  const isDone = new Deferred()
  const max = 10
  async function* finiteIntegers() {
    let n = 0
    while (n < max) {
      yield n++
    }
    isDone.resolve()
  }
  const noop = jest.fn(() => Promise.resolve())
  const loop = new ProcessingLoop(logger, 1, finiteIntegers(), noop)
  const whenComplete = loop.start()
  await isDone
  await whenComplete
  expect(noop).toBeCalledTimes(max)
})

test('stop generator after processing (idempotent)', async () => {
  const isDone = new Deferred()
  const max = 10
  async function* finiteIntegers() {
    let n = 0
    while (n < max) {
      yield n++
    }
    isDone.resolve()
  }
  const source = finiteIntegers()
  const returnSpy = jest.spyOn(source, 'return')
  const noop = jest.fn(() => Promise.resolve())
  const loop = new ProcessingLoop(logger, 1, source, noop)
  void loop.start()
  await isDone
  expect(returnSpy).not.toBeCalled()
  await loop.stop()
  expect(returnSpy).toBeCalled()
})

test('stop generator', async () => {
  const source = infiniteIntegers()
  const returnSpy = jest.spyOn(source, 'return')
  const noop = jest.fn(() => Promise.resolve())
  const loop = new ProcessingLoop(logger, 1, source, noop)
  void loop.start()
  expect(returnSpy).not.toBeCalled()
  await loop.stop()
  expect(returnSpy).toBeCalled()
})

test('Errors are swallowed', async () => {
  const isDone = new Deferred()
  const max = 2
  const errorAfter = 1

  async function* finiteIntegers() {
    let n = 0
    while (n < max) {
      yield n++
    }
    isDone.resolve()
  }
  const source = finiteIntegers()
  const returnSpy = jest.spyOn(source, 'return')
  const noop = jest.fn().mockImplementation((n: number) => {
    if (n >= errorAfter) {
      throw new Error(`Valhalla welcomes you`)
    }
  })
  const loop = new ProcessingLoop(logger, 1, source, noop)
  const whenComplete = loop.start()
  await isDone
  await whenComplete
  expect(noop).toHaveBeenCalledTimes(max)
  expect(returnSpy).not.toBeCalled()
  await loop.stop()
  expect(returnSpy).toBeCalled()
})
