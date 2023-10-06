import { expect, jest, test } from '@jest/globals'
import { firstValueFrom, lastValueFrom } from 'rxjs'
import { deferAbortable } from '../defer-abortable.js'
import { TestUtils } from '@ceramicnetwork/common'

test('happy case', async () => {
  const call = jest.fn(() => Promise.resolve('value'))
  const o$ = deferAbortable(() => call())
  const first = await firstValueFrom(o$)
  expect(first).toEqual('value')
  expect(call).toBeCalledTimes(1)
  const last = await lastValueFrom(o$)
  expect(last).toEqual('value')
  expect(call).toBeCalledTimes(2)
})

test('usual error', async () => {
  const call = jest.fn(() => Promise.reject(new Error(`usual`)))
  const o$ = deferAbortable(() => call())
  await expect(firstValueFrom(o$)).rejects.toThrow(/usual/)
  expect(call).toBeCalledTimes(1)
  await expect(lastValueFrom(o$)).rejects.toThrow(/usual/)
  expect(call).toBeCalledTimes(2)
})

test('abort on unsubscribe', async () => {
  const longDelay = 10000
  const delayBeforeAbort = 200
  const call = jest.fn((signal: AbortSignal) => {
    return TestUtils.delay(longDelay, signal)
  })

  const o$ = deferAbortable(call)
  const nextFn = jest.fn()
  const errorFn = jest.fn()
  const completeFn = jest.fn()
  const subscription = o$.subscribe({
    next: nextFn,
    error: errorFn,
    complete: completeFn,
  })
  await TestUtils.delay(delayBeforeAbort)
  subscription.unsubscribe()
  // No errors, and no actions
  expect(nextFn).not.toBeCalled()
  expect(errorFn).not.toBeCalled()
  expect(completeFn).not.toBeCalled()
})
