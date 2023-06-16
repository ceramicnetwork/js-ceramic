import { jest } from '@jest/globals'
import { whenSubscriptionDone } from '../../../__tests__/when-subscription-done.util.js'
import { generateFakeCarFile, FAKE_STREAM_ID, FAKE_TIP_CID } from './generateFakeCarFile.js'

const MAX_FAILED_ATTEMPTS = 2
let attemptNum = 0

const casProcessingResponse = {
  status: 'PROCESSING',
  message: `CAS is finally available; nonce: ${Math.random()}`,
  streamId: FAKE_STREAM_ID.toString(),
  cid: FAKE_TIP_CID.toString(),
}

jest.unstable_mockModule('cross-fetch', () => {
  const fetchFunc = jest.fn(async (url: string, opts: any = {}) => ({
    ok: true,
    json: async () => {
      attemptNum += 1
      if (attemptNum <= MAX_FAILED_ATTEMPTS + 1) {
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
  const common = await import('@ceramicnetwork/common')
  const codecs = await import('@ceramicnetwork/codecs')
  const eas = await import('../ethereum-anchor-service.js')
  const loggerProvider = new common.LoggerProvider()
  const diagnosticsLogger = loggerProvider.getDiagnosticsLogger()
  const errSpy = jest.spyOn(diagnosticsLogger, 'err')
  const anchorService = new eas.EthereumAnchorService('http://example.com', diagnosticsLogger, 100)
  let lastResponse: any
  const subscription = anchorService.requestAnchor(generateFakeCarFile()).subscribe((response) => {
    if (response.status === codecs.AnchorRequestStatusName.PROCESSING) {
      lastResponse = response
      subscription.unsubscribe()
    }
  })
  await whenSubscriptionDone(subscription)
  expect(lastResponse.message).toEqual(casProcessingResponse.message)
  expect(errSpy).toBeCalledTimes(3)
})
