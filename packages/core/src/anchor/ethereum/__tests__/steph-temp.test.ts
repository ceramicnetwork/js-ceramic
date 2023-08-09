import { jest, test, expect } from '@jest/globals'
import { whenSubscriptionDone } from '../../../__tests__/when-subscription-done.util.js'
import { EthereumAnchorService } from '../ethereum-anchor-service.js'
import { TestUtils } from '@ceramicnetwork/common'

const POLL_INTERVAL = 1000 // ms
const MAX_POLL_TIME = 15000 // ms - to test if polling stops after this threshold

jest.setTimeout(20000)

test('oldPollForAnchorResponse', async () => {
  const { LoggerProvider } = await import('@ceramicnetwork/common')

  const diagnosticsLogger = new LoggerProvider().getDiagnosticsLogger()
  const anchorService = new EthereumAnchorService(
    'http://example.com',
    diagnosticsLogger,
    POLL_INTERVAL,
    MAX_POLL_TIME
  )

  let attempts = 0
  const task = jest.fn(async () => {
    attempts += 1
    console.log('ATTEMPT', attempts)
    await TestUtils.delay(2000)
    if (attempts > 1 && attempts <= 4) {
      throw new Error('TASK FAILED')
    }
    return Promise.resolve('TASK COMPLETED')
  })

  const anchorResponse$ = anchorService.oldPollForAnchorResponse(task)

  let error
  let nextCount = 0
  let errorCount = 0
  const subscription = anchorResponse$.subscribe({
    next: () => {
      nextCount += 1
      console.log('Subscription next:', nextCount)
    },
    error: (e) => {
      error = e
      errorCount += 1
      console.log('Subscription error:', errorCount)
    },
  })
  await whenSubscriptionDone(subscription)

  expect(String(error)).toEqual('Error: Exceeded max anchor polling time limit')
  expect(errorCount).toEqual(1)
})

/*
    oldPollForAnchorResponse: received value from interval 0
    oldPollForAnchorResponse: time elapsed 1048
    oldPollForAnchorResponse: doing task 1051
    ATTEMPT 1
    oldPollForAnchorResponse: received value from interval 1  // OBSERVATION: received interval during task 
    oldPollForAnchorResponse: received value from interval 2
    oldPollForAnchorResponse: after task 3058
    oldPollForAnchorResponse: received value after concatMap TASK COMPLETED
    Subscription next: 1
    oldPollForAnchorResponse: time elapsed 3067 
    oldPollForAnchorResponse: doing task 3068 // OBVSERVATION: minimal delay (last finished 3058)
    ATTEMPT 2
    oldPollForAnchorResponse: received value from interval 3
    oldPollForAnchorResponse: received value from interval 4
    [2023-08-09T19:49:02.695Z] ERROR: Error: oldPollForAnchorResponse: error received Error: TASK FAILED at 5072
    oldPollForAnchorResponse: received value from interval 5
    oldPollForAnchorResponse: doing task 6079 // OBVSERVATION: correct delay (last finished 5072)
    ATTEMPT 3
    oldPollForAnchorResponse: received value from interval 6
    oldPollForAnchorResponse: received value from interval 7
    [2023-08-09T19:49:05.706Z] ERROR: Error: oldPollForAnchorResponse: error received Error: TASK FAILED at 8083
    oldPollForAnchorResponse: received value from interval 8
    oldPollForAnchorResponse: doing task 9086 // OBVSERVATION: correct delay (last finished 8083)
    ATTEMPT 4
    oldPollForAnchorResponse: received value from interval 9
    oldPollForAnchorResponse: received value from interval 10
    [2023-08-09T19:49:08.714Z] ERROR: Error: oldPollForAnchorResponse: error received Error: TASK FAILED at 11091
    oldPollForAnchorResponse: received value from interval 11
    oldPollForAnchorResponse: doing task 12094 // OBVSERVATION: correct delay (last finished 11091)
    ATTEMPT 5
    oldPollForAnchorResponse: received value from interval 12
    oldPollForAnchorResponse: received value from interval 13
    oldPollForAnchorResponse: after task 14100
    oldPollForAnchorResponse: received value after concatMap TASK COMPLETED
    Subscription next: 2
    oldPollForAnchorResponse: time elapsed 14104
    oldPollForAnchorResponse: doing task 14105 // OBVSERVATION: minimal delay (last finished 14100)
    ATTEMPT 6
    oldPollForAnchorResponse: received value from interval 14
    oldPollForAnchorResponse: received value from interval 15 // OBSERVATION: 15 values queued up even tho we are on attempt 6 
    oldPollForAnchorResponse: after task 16110
    oldPollForAnchorResponse: received value after concatMap TASK COMPLETED
    Subscription next: 3
    oldPollForAnchorResponse: time elapsed 16112
    Subscription error: 1
*/

test('newPollForAnchorResponse', async () => {
  const { LoggerProvider } = await import('@ceramicnetwork/common')

  const diagnosticsLogger = new LoggerProvider().getDiagnosticsLogger()
  const anchorService = new EthereumAnchorService(
    'http://example.com',
    diagnosticsLogger,
    POLL_INTERVAL,
    MAX_POLL_TIME
  )

  let attempts = 0
  const task = jest.fn(async () => {
    attempts += 1
    console.log('ATTEMPT', attempts)
    await TestUtils.delay(2000)
    if (attempts > 1 && attempts <= 4) {
      throw new Error('TASK FAILED')
    }
    return Promise.resolve('TASK COMPLETED')
  })

  const anchorResponse$ = anchorService.newPollForAnchorResponse(task)

  let error
  let nextCount = 0
  let errorCount = 0
  const subscription = anchorResponse$.subscribe({
    next: () => {
      nextCount += 1
      console.log('Subscription next:', nextCount)
    },
    error: (e) => {
      error = e
      errorCount += 1
      console.log('Subscription error:', errorCount)
    },
  })
  await whenSubscriptionDone(subscription)

  expect(String(error)).toEqual('Error: Exceeded max anchor polling time limit')
  expect(errorCount).toEqual(1)
})

/*
    newPollForAnchorResponse: doing task 0
    ATTEMPT 1
    newPollForAnchorResponse: after task 2024
    newPollForAnchorResponse: received first value TASK COMPLETED
    newPollForAnchorResponse: received value after expand TASK COMPLETED
    Subscription next: 1
    newPollForAnchorResponse: time elapsed 2033
    newPollForAnchorResponse: task to be completed in ms 1000
    newPollForAnchorResponse: doing task 3036 // OBVSERVATION: Correct delay (last finished 2024)
    ATTEMPT 2
    [2023-08-09T19:45:46.948Z] ERROR: Error: newPollForAnchorResponse: error received Error: TASK FAILED at 5050
    newPollForAnchorResponse: doing task 6058 // OBVSERVATION: Correct delay (last finished 5050)
    ATTEMPT 3
    [2023-08-09T19:45:49.960Z] ERROR: Error: newPollForAnchorResponse: error received Error: TASK FAILED at 8063
    newPollForAnchorResponse: doing task 9066 // OBVSERVATION: Correct delay (last finished 8063)
    ATTEMPT 4
    [2023-08-09T19:45:52.970Z] ERROR: Error: newPollForAnchorResponse: error received Error: TASK FAILED at 11073
    newPollForAnchorResponse: doing task 12078 // OBVSERVATION: Correct delay (last finished 11073)
    ATTEMPT 5
    newPollForAnchorResponse: after task 14156
    newPollForAnchorResponse: received value after expand TASK COMPLETED
    Subscription next: 2
    newPollForAnchorResponse: time elapsed 14299
    newPollForAnchorResponse: task to be completed in ms 1000
    newPollForAnchorResponse: doing task 15328 // OBVSERVATION: Correct delay (last finished 14156)
    ATTEMPT 6
    newPollForAnchorResponse: after task 17338
    newPollForAnchorResponse: received value after expand TASK COMPLETED
    Subscription next: 3
    newPollForAnchorResponse: time elapsed 17349 
    Subscription error: 1
*/
