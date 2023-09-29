import { jest } from '@jest/globals'
import { whenSubscriptionDone } from '../../../__tests__/when-subscription-done.util.js'
import { generateFakeCarFile, FAKE_STREAM_ID, FAKE_TIP_CID } from './generateFakeCarFile.js'
import { AnchorRequestStore } from '../../../store/anchor-request-store.js'
import type { AnchorValidator } from '../../anchor-service.js'

const MAX_FAILED_ATTEMPTS = 2
let attemptNum = 0

const casProcessingResponse = {
  id: 'fake-id',
  status: 'PROCESSING',
  message: `CAS is finally available; nonce: ${Math.random()}`,
  streamId: FAKE_STREAM_ID.toString(),
  cid: FAKE_TIP_CID.toString(),
}

const fetchFunc = jest.fn(async (url: string, opts: any = {}) => {
  if (url.includes('/service-info/supported_chains')) {
    return {
      supportedChains: ['eip155:1'],
    }
  }
  attemptNum += 1
  if (attemptNum <= MAX_FAILED_ATTEMPTS + 1) {
    throw new Error(`Cas is unavailable`)
  }
  return casProcessingResponse
})

jest.setTimeout(20000)

let ipfs: any
let ceramic: any

afterAll(async () => {
  ceramic && (await ceramic.close())
  ipfs && (await ipfs.stop())
})

test('re-request an anchor till get a response', async () => {
  const common = await import('@ceramicnetwork/common')
  const codecs = await import('@ceramicnetwork/codecs')
  const eas = await import('../ethereum-anchor-service.js')
  const { createIPFS } = await import('@ceramicnetwork/ipfs-daemon')
  const { createCeramic } = await import('../../../__tests__/create-ceramic.js')
  const { createDidAnchorServiceAuth } = await import(
    '../../../__tests__/create-did-anchor-service-auth.js'
  )
  const loggerProvider = new common.LoggerProvider()
  const diagnosticsLogger = loggerProvider.getDiagnosticsLogger()
  const warnSpy = jest.spyOn(diagnosticsLogger, 'warn')
  const url = 'http://example.com'

  ipfs = await createIPFS()
  ceramic = await createCeramic(ipfs, { streamCacheLimit: 1, anchorOnRequest: true })
  const { auth } = createDidAnchorServiceAuth(url, ceramic, diagnosticsLogger, fetchFunc)
  const anchorService = new eas.AuthenticatedEthereumAnchorService(
    auth,
    url,
    url,
    diagnosticsLogger,
    100
  )
  anchorService.validator.init = jest.fn() as AnchorValidator['init']
  const anchorRequestStore = { save: jest.fn() } as unknown as AnchorRequestStore
  await anchorService.init(anchorRequestStore, async () => false)

  let lastResponse: any
  const subscription = (await anchorService.requestAnchor(generateFakeCarFile(), false)).subscribe(
    (response) => {
      if (response.status === codecs.AnchorRequestStatusName.PROCESSING) {
        lastResponse = response
        subscription.unsubscribe()
      }
    }
  )
  await whenSubscriptionDone(subscription)
  expect(lastResponse.message).toEqual(casProcessingResponse.message)
  expect(warnSpy).toBeCalledTimes(3)
})
