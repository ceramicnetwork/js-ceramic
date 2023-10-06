import { jest } from '@jest/globals'
import { whenSubscriptionDone } from '../../../__tests__/when-subscription-done.util.js'
import { generateFakeCarFile, FAKE_STREAM_ID, FAKE_TIP_CID } from './generateFakeCarFile.js'
import type { fetchJson } from '@ceramicnetwork/common'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { createDidAnchorServiceAuth } from '../../../__tests__/create-did-anchor-service-auth.js'
import { LoggerProvider } from '@ceramicnetwork/common'
import { AuthenticatedEthereumAnchorService } from '../ethereum-anchor-service.js'
import { createCeramic } from '../../../__tests__/create-ceramic.js'
import { AnchorRequestStatusName } from '@ceramicnetwork/codecs'

const MAX_FAILED_ATTEMPTS = 2
let attemptNum = 0

const casProcessingResponse = {
  id: 'fake-id',
  status: 'PROCESSING',
  message: `CAS is finally available; nonce: ${Math.random()}`,
  streamId: FAKE_STREAM_ID.toString(),
  cid: FAKE_TIP_CID.toString(),
}

const fauxFetchJson: typeof fetchJson = async () => {
  attemptNum += 1
  if (attemptNum <= MAX_FAILED_ATTEMPTS + 1) {
    throw new Error(`Cas is unavailable`)
  }
  return casProcessingResponse
}

jest.setTimeout(20000)

let ipfs: any
let ceramic: any

afterAll(async () => {
  ceramic && (await ceramic.close())
  ipfs && (await ipfs.stop())
})

test('re-request an anchor till get a response', async () => {
  const diagnosticsLogger = new LoggerProvider().getDiagnosticsLogger()
  const warnSpy = jest.spyOn(diagnosticsLogger, 'warn')
  const url = 'http://example.com'

  ipfs = await createIPFS()
  ceramic = await createCeramic(ipfs, { streamCacheLimit: 1, anchorOnRequest: true })
  const auth = createDidAnchorServiceAuth(url, ceramic, diagnosticsLogger, fauxFetchJson)
  const anchorService = new AuthenticatedEthereumAnchorService(
    auth,
    url,
    url,
    diagnosticsLogger,
    100
  )

  let lastResponse: any
  const subscription = (await anchorService.requestAnchor(generateFakeCarFile(), false)).subscribe(
    (response) => {
      if (response.status === AnchorRequestStatusName.PROCESSING) {
        lastResponse = response
        subscription.unsubscribe()
      }
    }
  )
  await whenSubscriptionDone(subscription)
  expect(lastResponse.message).toEqual(casProcessingResponse.message)
  expect(warnSpy).toBeCalledTimes(3)
})
