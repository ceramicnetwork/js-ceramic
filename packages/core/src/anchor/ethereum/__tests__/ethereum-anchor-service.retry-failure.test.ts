import { jest, test, expect } from '@jest/globals'
import { whenSubscriptionDone } from '../../../__tests__/when-subscription-done.util.js'
import { generateFakeCarFile, FAKE_STREAM_ID, FAKE_TIP_CID } from './generateFakeCarFile.js'

const MAX_FAILED_ATTEMPTS = 2
let fetchAttemptNum = 0

const casProcessingResponse = {
  id: '',
  status: 'PROCESSING',
  message: `CAS is finally available; nonce: ${Math.random()}`,
  streamId: FAKE_STREAM_ID.toString(),
  cid: FAKE_TIP_CID.toString(),
}

jest.unstable_mockModule('cross-fetch', () => {
  const fetchFunc = jest.fn(async (url: string, opts: any = {}) => ({
    ok: true,
    json: async () => {
      fetchAttemptNum += 1
      if (fetchAttemptNum <= MAX_FAILED_ATTEMPTS + 1) {
        throw new Error(`Cas is unavailable`)
      }
      return casProcessingResponse
    },
  }))
  return {
    default: fetchFunc,
  }
})

test('re-request an anchor till get a response', async () => {
  fetchAttemptNum = 0
  const { LoggerProvider } = await import('@ceramicnetwork/common')
  const { AnchorRequestStatusName } = await import('@ceramicnetwork/codecs')
  const { EthereumAnchorService } = await import('../ethereum-anchor-service.js')
  const diagnosticsLogger = new LoggerProvider().getDiagnosticsLogger()
  const errSpy = jest.spyOn(diagnosticsLogger, 'err')
  const anchorService = new EthereumAnchorService('http://example.com', diagnosticsLogger, 100)
  let lastResponse: any
  const subscription = anchorService.requestAnchor(generateFakeCarFile()).subscribe((response) => {
    if (response.status === AnchorRequestStatusName.PROCESSING) {
      lastResponse = response
      subscription.unsubscribe()
    }
  })
  await whenSubscriptionDone(subscription)
  expect(lastResponse.message).toEqual(casProcessingResponse.message)
  expect(errSpy).toBeCalledTimes(3)
})

test('re-poll on fetch error', async () => {
  fetchAttemptNum = 0
  const { LoggerProvider } = await import('@ceramicnetwork/common')
  const { AnchorRequestStatusName } = await import('@ceramicnetwork/codecs')
  const { EthereumAnchorService } = await import('../ethereum-anchor-service.js')
  const diagnosticsLogger = new LoggerProvider().getDiagnosticsLogger()
  const errSpy = jest.spyOn(diagnosticsLogger, 'err')
  const anchorService = new EthereumAnchorService('http://example.com', diagnosticsLogger, 100)
  const streamId = FAKE_STREAM_ID
  const anchorResponse$ = anchorService.pollForAnchorResponse(streamId, streamId.cid)
  let lastResponse: any
  const subscription = anchorResponse$.subscribe((response) => {
    if (response.status === AnchorRequestStatusName.PROCESSING) {
      lastResponse = response
      subscription.unsubscribe()
    }
  })
  await whenSubscriptionDone(subscription)
  expect(lastResponse.message).toEqual(casProcessingResponse.message)
  expect(errSpy).toBeCalledTimes(3)
})

test('stop polling after max time', async () => {
  fetchAttemptNum = 0
  const { LoggerProvider } = await import('@ceramicnetwork/common')
  const { EthereumAnchorService } = await import('../ethereum-anchor-service.js')
  const diagnosticsLogger = new LoggerProvider().getDiagnosticsLogger()
  const anchorService = new EthereumAnchorService('http://example.com', diagnosticsLogger, 100, 500)
  const streamId = FAKE_STREAM_ID
  const anchorResponse$ = anchorService.pollForAnchorResponse(streamId, streamId.cid)
  let error
  const subscription = anchorResponse$.subscribe({
    error: (e) => {
      error = e
    },
  })
  await whenSubscriptionDone(subscription)
  expect(String(error)).toEqual('Error: Exceeded max anchor polling time limit')
})
