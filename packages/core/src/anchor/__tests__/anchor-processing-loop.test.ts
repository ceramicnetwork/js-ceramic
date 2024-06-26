import { test, jest, expect, describe } from '@jest/globals'
import { ProcessingLoop, Deferred } from '../processing-loop.js'
import { LoggerProvider } from '@ceramicnetwork/common'
import { CommonTestUtils } from '@ceramicnetwork/common-test-utils'
import { doNotWait } from '../../ancillary/do-not-wait.js'

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
  const loop = new ProcessingLoop(logger, max, source, noop)
  const whenComplete = loop.start()
  await isDone
  await whenComplete
  expect(noop).toHaveBeenCalledTimes(max)
  expect(returnSpy).not.toBeCalled()
  await loop.stop()
  expect(returnSpy).toBeCalled()
})

test('Processing loop blocks on concurrency limit', async () => {
  const isDone = new Deferred()
  const MAX = 10
  const CONCURRENT = 3
  async function* finiteIntegers() {
    let n = 0
    while (n < MAX) {
      yield n++
    }
    isDone.resolve()
  }

  const allowProcessing = new Deferred()
  const process = jest.fn(async () => {
    await allowProcessing
  })
  const loop = new ProcessingLoop(logger, CONCURRENT, finiteIntegers(), process)
  const whenComplete = loop.start()

  await CommonTestUtils.delay(1000)
  // while the processing work is blocked, only allow a number of tasks to begin processing up to
  // the concurrency limit.
  expect(process).toBeCalledTimes(CONCURRENT)
  allowProcessing.resolve()

  await isDone
  await whenComplete
  expect(process).toBeCalledTimes(MAX)
})

test('Dont process the same entry multiple times concurrently', async () => {
  const isDone = new Deferred()
  const max = 10
  const toProcess = new Set<number>(Array.from({ length: max }).map((_, index) => index))

  // Will regenerate the same entries until they get processed.
  async function* overEntries(): AsyncGenerator<number> {
    do {
      // Need this sleep or else the Node runtime might never switch back to the "process" function.
      await CommonTestUtils.delay(1)
      for (const entry of toProcess) yield entry
    } while (!isDone.isResolved)
  }

  const process = jest.fn(async (entry) => {
    await CommonTestUtils.delay(100)
    toProcess.delete(entry)
    if (toProcess.size == 0) {
      isDone.resolve()
    }
  })
  const loop = new ProcessingLoop(logger, max * 2, overEntries(), process)
  doNotWait(loop.start(), logger)
  await isDone
  await loop.stop()
  expect(process).toBeCalledTimes(max)
})
