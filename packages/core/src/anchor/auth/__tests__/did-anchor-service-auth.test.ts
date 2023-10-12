import { expect, jest } from '@jest/globals'
import tmp from 'tmp-promise'
import { fetchJson, LoggerProvider } from '@ceramicnetwork/common'
import { createDidAnchorServiceAuth } from '../../../__tests__/create-did-anchor-service-auth.js'
import { createCeramic } from '../../../__tests__/create-ceramic.js'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import type { DIDAnchorServiceAuth } from '../did-anchor-service-auth.js'

const MOCKED_URLS = {
  OFFLINE: 'http://offline.test.ts',
  ONLINE: 'https://online.test.ts',
  ACCEPT: `https://online.test.ts.accept/api/v0/service-info/supported_chains`,
  REJECT: `https://online.test.ts.reject/api/v0/service-info/supported_chains`,
}

const fauxFetchJson = jest.fn().mockImplementation(async (url: string) => {
  if (url.startsWith(MOCKED_URLS.ONLINE)) {
    if (url.startsWith(MOCKED_URLS.ACCEPT)) {
      return { supportedChains: ['eip155:100'] }
    } else {
      return 'Unauthorized'
    }
  }
  throw Error('Offline')
})

let ipfs: any
let ceramic: any
let auth: DIDAnchorServiceAuth
let tmpFolder: any

beforeAll(async () => {
  ipfs = await createIPFS()
})

afterAll(async () => {
  await ipfs.stop()
})

describe('sendAuthenticatedRequest', () => {
  jest.setTimeout(300000) // 5mins time-out for js-ipfs

  beforeEach(async () => {
    tmpFolder = await tmp.dir({ unsafeCleanup: true })
    ceramic = await createCeramic(ipfs, {
      stateStoreDirectory: tmpFolder.path,
    })
    const logger = new LoggerProvider().getDiagnosticsLogger()
    auth = createDidAnchorServiceAuth(
      MOCKED_URLS.ONLINE,
      ceramic,
      logger,
      fauxFetchJson as unknown as typeof fetchJson
    )
    await auth.init()
  })

  afterEach(async () => {
    await ceramic.close()
    await tmpFolder.cleanup()
  })

  test('sends request with signed payload in `authorization` header', async () => {
    const signRequestSpy = jest.spyOn(auth, 'signRequest')
    await auth.sendAuthenticatedRequest(MOCKED_URLS.ONLINE)
    const out = (await signRequestSpy.mock.results[0].value) as any
    expect(out.request.url).toEqual(MOCKED_URLS.ONLINE)
    const jws = out.request.opts.headers['Authorization'].split(' ')[1]
    const data = await ceramic.did.verifyJWS(jws)
    expect(data.payload.url).toEqual(MOCKED_URLS.ONLINE)
    expect(fauxFetchJson).toBeCalledWith(MOCKED_URLS.ONLINE, {
      headers: { Authorization: `Bearer ${jws}` },
    })
  })

  test('does not send same nonce more than once', async () => {
    const signRequestSpy = jest.spyOn(auth, 'signRequest')
    await auth.sendAuthenticatedRequest(MOCKED_URLS.ONLINE)
    const out0 = (await signRequestSpy.mock.results[0].value) as any
    await auth.sendAuthenticatedRequest(MOCKED_URLS.ONLINE)
    const out1 = (await signRequestSpy.mock.results[1].value) as any
    await auth.sendAuthenticatedRequest(MOCKED_URLS.ONLINE)
    const out2 = (await signRequestSpy.mock.results[2].value) as any

    const jws0 = await ceramic.did.verifyJWS(out0.jws)
    const jws1 = await ceramic.did.verifyJWS(out1.jws)
    const jws2 = await ceramic.did.verifyJWS(out2.jws)
    const arr = [jws0, jws1, jws2]
    const set = new Set(arr.map((jws) => jws.payload.nonce))
    expect(set.size).toBe(3)

    expect(fauxFetchJson).toBeCalledWith(MOCKED_URLS.ONLINE, {
      headers: out0.request.opts.headers,
    })
    expect(fauxFetchJson).toBeCalledWith(MOCKED_URLS.ONLINE, {
      headers: out1.request.opts.headers,
    })
    expect(fauxFetchJson).toBeCalledWith(MOCKED_URLS.ONLINE, {
      headers: out2.request.opts.headers,
    })
  })
})
