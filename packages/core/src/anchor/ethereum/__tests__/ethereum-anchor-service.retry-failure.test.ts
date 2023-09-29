import { jest, test, expect, afterEach } from '@jest/globals'
import { whenSubscriptionDone } from '../../../__tests__/when-subscription-done.util.js'
import { generateFakeCarFile, FAKE_STREAM_ID, FAKE_TIP_CID } from './generateFakeCarFile.js'
import { type fetchJson, LoggerProvider } from '@ceramicnetwork/common'
import { AnchorRequestStatusName } from '@ceramicnetwork/codecs'
import { EthereumAnchorService } from '../ethereum-anchor-service.js'
import { filter, firstValueFrom } from 'rxjs'

const MAX_FAILED_ATTEMPTS = 2
const POLL_INTERVAL = 100 // ms
const MAX_POLL_TIME = 500 // ms - to test if polling stops after this threshold

const CAS_PROCESSING_RESPONSE = {
  id: '',
  status: 'PROCESSING',
  message: `CAS is finally available; nonce: ${Math.random()}`,
  streamId: FAKE_STREAM_ID.toString(),
  cid: FAKE_TIP_CID.toString(),
}

let fetchAttemptNum = 0
const fauxFetchFunc = jest.fn().mockImplementation(async () => {
  fetchAttemptNum += 1
  if (fetchAttemptNum <= MAX_FAILED_ATTEMPTS + 1) {
    throw new Error(`Cas is unavailable`)
  }
  return CAS_PROCESSING_RESPONSE
})

afterEach(async () => {
  fauxFetchFunc.mockClear()
})

test('re-request an anchor till get a response', async () => {
  fetchAttemptNum = 0
  const diagnosticsLogger = new LoggerProvider().getDiagnosticsLogger()
  const warnSpy = jest.spyOn(diagnosticsLogger, 'warn')
  const anchorService = new EthereumAnchorService(
    'http://example.com',
    'http://example.com',
    diagnosticsLogger,
    POLL_INTERVAL,
    MAX_POLL_TIME,
    fauxFetchFunc as typeof fetchJson
  )
  const requestCAR = generateFakeCarFile()
  const response$ = await anchorService.requestAnchor(requestCAR, false)
  const lastResponse = await firstValueFrom(
    response$.pipe(filter((r) => r.status === AnchorRequestStatusName.PROCESSING))
  )
  expect(lastResponse.message).toEqual(CAS_PROCESSING_RESPONSE.message)
  expect(warnSpy).toBeCalledTimes(3)
  expect(fauxFetchFunc).toBeCalledWith(
    'http://example.com/api/v0/requests',
    expect.objectContaining({
      body: requestCAR.bytes,
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.ipld.car',
      },
    })
  )
})

// FIXME Does not belong here. Should be tested somewhere else
test.skip('re-poll on fetch error', async () => {
  fetchAttemptNum = 0
  const diagnosticsLogger = new LoggerProvider().getDiagnosticsLogger()
  const warnSpy = jest.spyOn(diagnosticsLogger, 'warn')
  const anchorService = new EthereumAnchorService(
    'http://example.com',
    'http://example.com',
    diagnosticsLogger,
    POLL_INTERVAL,
    MAX_POLL_TIME,
    fauxFetchFunc as unknown as typeof fetchJson
  )
  const streamId = FAKE_STREAM_ID
  const anchorResponse$ = anchorService.pollForAnchorResponse(streamId, streamId.cid)
  let lastResponse: any
  let nextCount = 0
  let errorCount = 0
  const subscription = anchorResponse$.subscribe({
    next: (response) => {
      nextCount += 1
      if (response.status === AnchorRequestStatusName.PROCESSING) {
        lastResponse = response
        subscription.unsubscribe()
      }
    },
    error: () => {
      errorCount += 1
    },
  })
  await whenSubscriptionDone(subscription)
  expect(lastResponse.message).toEqual(CAS_PROCESSING_RESPONSE.message)
  expect(warnSpy).toBeCalledTimes(3)
  expect(nextCount).toEqual(1)
  expect(errorCount).toEqual(0)
  expect(fauxFetchFunc).toBeCalledWith(
    `http://example.com/api/v0/requests/${streamId.cid}`,
    expect.objectContaining({ signal: expect.any(AbortSignal) })
  )
})

// FIXME Does not make sense here
test.skip('stop polling after max time', async () => {
  fetchAttemptNum = 0
  const diagnosticsLogger = new LoggerProvider().getDiagnosticsLogger()
  const anchorService = new EthereumAnchorService(
    'http://example.com',
    'http://example.com',
    diagnosticsLogger,
    POLL_INTERVAL,
    MAX_POLL_TIME,
    fauxFetchFunc as unknown as typeof fetchJson
  )
  const streamId = FAKE_STREAM_ID
  const anchorResponse$ = anchorService.pollForAnchorResponse(streamId, streamId.cid)
  let error
  let nextCount = 0
  let errorCount = 0
  const subscription = anchorResponse$.subscribe({
    next: () => {
      nextCount += 1
    },
    error: (e) => {
      error = e
      errorCount += 1
    },
  })
  await whenSubscriptionDone(subscription)
  expect(String(error)).toEqual('Error: Exceeded max anchor polling time limit')
  expect(errorCount).toEqual(1)
  // During the 5 ms, there is the intial call, then 2 retries (2 ms) and 3 successes (3 ms)
  expect(nextCount).toEqual(3)
  expect(fauxFetchFunc).toBeCalledWith(
    `http://example.com/api/v0/requests/${streamId.cid}`,
    expect.objectContaining({ signal: expect.any(AbortSignal) })
  )
})
