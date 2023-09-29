import { expect, jest } from '@jest/globals'
import { generateFakeCarFile, FAKE_STREAM_ID, FAKE_TIP_CID } from './generateFakeCarFile.js'
import type { fetchJson } from '@ceramicnetwork/common'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { createDidAnchorServiceAuth } from '../../../__tests__/create-did-anchor-service-auth.js'
import { LoggerProvider } from '@ceramicnetwork/common'
import { AuthenticatedEthereumAnchorService } from '../ethereum-anchor-service.js'
import { createCeramic } from '../../../__tests__/create-ceramic.js'
import { AnchorRequestStatusName } from '@ceramicnetwork/codecs'
import { filter, firstValueFrom } from 'rxjs'

const MAX_FAILED_ATTEMPTS = 2
let attemptNum = 0

const casProcessingResponse = {
  id: 'fake-id',
  status: 'PROCESSING',
  message: `CAS is finally available; nonce: ${Math.random()}`,
  streamId: FAKE_STREAM_ID.toString(),
  cid: FAKE_TIP_CID.toString(),
}

const fauxFetchJson = jest.fn().mockImplementation(async () => {
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

// FIXME Does not make sense here
test.skip('re-request an anchor till get a response', async () => {
  const diagnosticsLogger = new LoggerProvider().getDiagnosticsLogger()
  const warnSpy = jest.spyOn(diagnosticsLogger, 'warn')
  const url = 'http://example.com'

  ipfs = await createIPFS()
  ceramic = await createCeramic(ipfs, { streamCacheLimit: 1, anchorOnRequest: true })
  const auth = createDidAnchorServiceAuth(
    url,
    ceramic,
    diagnosticsLogger,
    fauxFetchJson as typeof fetchJson
  )
  const anchorService = new AuthenticatedEthereumAnchorService(
    auth,
    url,
    url,
    diagnosticsLogger,
    100
  )
  const signRequestSpy = jest.spyOn(auth, 'signRequest')

  const requestCAR = generateFakeCarFile()
  const response$ = await anchorService.requestAnchor(requestCAR, false)
  const lastResponse = await firstValueFrom(
    response$.pipe(filter((r) => r.status === AnchorRequestStatusName.PROCESSING))
  )
  const out0 = (await signRequestSpy.mock.results[0].value) as any
  expect(lastResponse.message).toEqual(casProcessingResponse.message)
  expect(warnSpy).toBeCalledTimes(3)

  const fetchOpts = out0.request.opts
  expect(fetchOpts.method).toEqual('POST')
  expect(fetchOpts.headers['Content-Type']).toEqual('application/vnd.ipld.car')
  expect(fetchOpts.headers['Authorization']).toMatch(/^Bearer\s/)
  expect(fetchOpts.body).toEqual(requestCAR.bytes)
  expect(fauxFetchJson).toBeCalledWith('http://example.com/api/v0/requests', fetchOpts)
})
