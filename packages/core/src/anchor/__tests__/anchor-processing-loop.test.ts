import { test, jest, expect } from '@jest/globals'
import { AnchorProcessingLoop, Deferred } from '../anchor-processing-loop.js'

async function* infiniteIntegers() {
  let n = 0
  while (true) {
    yield n++
  }
}

test('do not call next on construction', async () => {
  const generator = infiniteIntegers()
  const nextSpy = jest.spyOn(generator, 'next')
  new AnchorProcessingLoop(generator, () => Promise.resolve())
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
  const loop = new AnchorProcessingLoop(finiteIntegers(), noop)
  loop.start()
  await isDone
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
  const loop = new AnchorProcessingLoop(source, noop)
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
  const loop = new AnchorProcessingLoop(source, noop)
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
  const loop = new AnchorProcessingLoop(source, noop)
  loop.start()
  await defer
  expect(returnSpy).not.toBeCalled()
  await expect(loop.stop()).rejects.toThrow(/Valhalla/)
  expect(returnSpy).toBeCalled()
})
