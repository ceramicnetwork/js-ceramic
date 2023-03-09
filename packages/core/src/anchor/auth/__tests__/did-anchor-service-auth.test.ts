import { jest } from '@jest/globals'
import tmp from 'tmp-promise'

const mockedUrls = {
  OFFLINE: 'http://offline.test.ts',
  ONLINE: 'https://online.test.ts',
  ACCEPT: `https://online.test.ts.accept/api/v0/service-info/supported_chains`,
  REJECT: `https://online.test.ts.reject/api/v0/service-info/supported_chains`,
}

jest.unstable_mockModule('cross-fetch', () => {
  const fetchFunc = jest.fn(async (url: string, opts: any = {}) => ({
    ok: true,
    json: async () => {
      if (url.startsWith(mockedUrls.ONLINE)) {
        if (url.startsWith(mockedUrls.ACCEPT)) {
          return { supportedChains: ['eip155:100'] }
        } else {
          return 'Unauthorized'
        }
      }
      throw Error('Offline')
    },
  }))
  return {
    default: fetchFunc,
  }
})

let ipfs: any
let ceramic: any
let auth: any
let tmpFolder: any

beforeAll(async () => {
  const { createIPFS } = await import('@ceramicnetwork/ipfs-daemon')
  ipfs = await createIPFS()
})

afterAll(async () => {
  await ipfs.stop()
})

describe('sendAuthenticatedRequest', () => {
  jest.setTimeout(300000) // 5mins time-out for js-ipfs

  beforeEach(async () => {
    const { createCeramic } = await import('../../../__tests__/create-ceramic.js')
    tmpFolder = await tmp.dir({ unsafeCleanup: true })
    ceramic = await createCeramic(ipfs, {
      stateStoreDirectory: tmpFolder.path,
    })
    const { createDidAnchorServiceAuth } = await import(
      '../../../__tests__/create-did-anchor-service-auth.js'
    )
    const { auth: didAuth } = createDidAnchorServiceAuth(mockedUrls.ONLINE, ceramic)
    auth = didAuth
    await auth.init()
  })

  afterEach(async () => {
    await ceramic.close()
    tmpFolder.cleanup()
  })

  test('sends request with signed payload in `authorization` header', async () => {
    const signRequestSpy = jest.spyOn(auth, 'signRequest')
    await auth.sendAuthenticatedRequest(mockedUrls.ONLINE)
    const getSignRequestResult = (): Promise<any> => signRequestSpy.mock.results[0].value
    const out: any = await getSignRequestResult()
    expect(out.request.url).toEqual(mockedUrls.ONLINE)
    const jws = out.request.opts.headers['Authorization'].split(' ')[1]
    const data = await ceramic.did.verifyJWS(jws)
    expect(data.payload.url).toEqual(mockedUrls.ONLINE)
  })
  test('does not send same nonce more than once', async () => {
    const signRequestSpy = jest.spyOn(auth, 'signRequest')
    const res0 = (): Promise<any> => signRequestSpy.mock.results[0].value
    const res1 = (): Promise<any> => signRequestSpy.mock.results[1].value
    const res2 = (): Promise<any> => signRequestSpy.mock.results[2].value
    await auth.sendAuthenticatedRequest(mockedUrls.ONLINE)
    await auth.sendAuthenticatedRequest(mockedUrls.ONLINE)
    await auth.sendAuthenticatedRequest(mockedUrls.ONLINE)
    const out0 = await res0()
    const out1 = await res1()
    const out2 = await res2()
    const jws0 = await ceramic.did.verifyJWS(out0.jws)
    const jws1 = await ceramic.did.verifyJWS(out1.jws)
    const jws2 = await ceramic.did.verifyJWS(out2.jws)
    const arr = [jws0, jws1, jws2]
    const set = new Set(arr.map((jws) => jws.payload.nonce))
    expect(set.size).toBe(3)
  })
})
