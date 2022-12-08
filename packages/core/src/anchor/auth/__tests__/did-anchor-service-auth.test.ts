import { jest } from '@jest/globals'

const mockedUrls = {
  OFFLINE: 'http://offline.test.ts',
  ONLINE: 'https://online.test.ts',
  nonceOffline: (did) => `http://offline.test.ts/api/v0/auth/did/${did}/nonce`,
  nonceOnline: (did) => `https://online.test.ts/api/v0/auth/did/${did}/nonce`
}

const mockedCalls = {
  'NONCE_OFFLINE': { response: { error: 'failed' } },
  'NONCE_ONLINE': { response: { nonce: 5 } },
}

jest.unstable_mockModule('cross-fetch', () => {
  const fetchFunc = jest.fn(async (url: string, opts: any = {}) => ({
    ok: true,
    json: async () => {
      if (url.startsWith(mockedUrls.OFFLINE)) {
        return mockedCalls.NONCE_OFFLINE
      } else {
        return mockedCalls.NONCE_ONLINE
      }
    },
  }))
  return {
    default: fetchFunc,
  }
})

let ipfs: any
let ceramic: any

beforeAll(async () => {
  await setup()
})

afterAll(async () => {
  await ceramic.close()
  await ipfs.stop()
})

const setup = async (): Promise<any> => {
  const { createIPFS } = await import('@ceramicnetwork/ipfs-daemon')
  const { createCeramic } = await import('../../../__tests__/create-ceramic.js')
  ipfs = await createIPFS()
  ceramic = await createCeramic(ipfs, { streamCacheLimit: 1, anchorOnRequest: false })
}

const setupAuth = async (url): Promise<any> => {
  const { createDidAnchorServiceAuth } = await import('../../../__tests__/create-did-anchor-service-auth.js')
  return createDidAnchorServiceAuth(url, ceramic)
}

describe('init', () => {
  jest.setTimeout(20000)

  test('initializes nonce to 0 if not retrieved by CAS', async () => {
    const { auth } = await setupAuth(mockedUrls.OFFLINE)
    await auth.init()
    expect(auth.nonce).toEqual(0)
  })
  test('initializes nonce retrieved by CAS', async () => {
    const { auth } = await setupAuth(mockedUrls.ONLINE)
    await auth.init()
    expect(auth.nonce).toEqual(5)
  })
})

describe('lookupLastNonce',  () => {
  jest.setTimeout(20000)
  test('creates a signed payload without nonce for the `authorization` header', async () => {
    const { auth } = await setupAuth(mockedUrls.ONLINE)
    await auth.init()

    const signRequestSpy = jest.spyOn(auth, 'signRequest')
    const getSignRequestResult = (): Promise<any> => signRequestSpy.mock.results[0].value;

    const jws = await ceramic.did.createJWS({
      url: mockedUrls.nonceOnline(ceramic.did.id)
    })
    const authorization = `Basic ${jws.signatures[0].protected}.${jws.payload}.${jws.signatures[0].signature}`

    await auth.lookupLastNonce()

    expect(signRequestSpy).toBeCalledWith(mockedUrls.nonceOnline(ceramic.did.id))
    expect(await getSignRequestResult()).toEqual({jws, authorization})
  })
})

describe('sendAuthenticatedRequest', () => {
  jest.setTimeout(20000)
  test('sends request with signed payload in `authorization` header', async () => {
    const { auth } = await setupAuth(mockedUrls.ONLINE)
    await auth.init()

    const signRequestSpy = jest.spyOn(auth, 'signRequest')
    const getSignRequestResult = (): Promise<any> => signRequestSpy.mock.results[0].value;

    const jws = await ceramic.did.createJWS({
      url: mockedUrls.nonceOnline(ceramic.did.id),
      nonce: 6
    })
    const authorization = `Basic ${jws.signatures[0].protected}.${jws.payload}.${jws.signatures[0].signature}`

    await auth.sendAuthenticatedRequest(mockedUrls.nonceOnline(ceramic.did.id))

    expect(await getSignRequestResult()).toEqual({jws, authorization})
  })
  test('increments nonce on success', async () => {
    const { auth } = await setupAuth(mockedUrls.ONLINE)
    await auth.init()
    expect(auth.nonce).toEqual(5)
    await auth.sendAuthenticatedRequest(mockedUrls.nonceOnline(auth.ceramic.did.id))
    expect(auth.nonce).toEqual(6)
    await auth.sendAuthenticatedRequest(mockedUrls.nonceOnline(auth.ceramic.did.id))
    expect(auth.nonce).toEqual(7)
  })
  test('increments nonce on failure', async () => {
    const { auth } = await setupAuth(mockedUrls.ONLINE)
    await auth.init()
    expect(auth.nonce).toEqual(5)
    await auth.sendAuthenticatedRequest(mockedUrls.nonceOffline(auth.ceramic.did.id))
    expect(auth.nonce).toEqual(6)
    await auth.sendAuthenticatedRequest(mockedUrls.nonceOnline(auth.ceramic.did.id))
    expect(auth.nonce).toEqual(7)
  })
})
