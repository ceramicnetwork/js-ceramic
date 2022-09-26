import { DID } from 'dids'
import { StreamID } from '@ceramicnetwork/streamid'
import { Context, fetchJson, TestUtils } from '@ceramicnetwork/common'
import { RemoteAdminApi } from '../remote-admin-api.js'
import { jest } from '@jest/globals'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import KeyResolver from 'key-did-resolver'
import { randomBytes } from '@stablelib/random'

const FAUX_ENDPOINT = new URL('https://example.com')
const MODEL = new StreamID(1, TestUtils.randomCID())
const SUCCESS_RESPONSE = {
  result: 'success'
}
const GET_RESPONSE = {
  models: [MODEL.toString()]
}

let FAUX_CONTEXT: Context

beforeAll(async () => {
  const seed = randomBytes(32)
  const provider = new Ed25519Provider(seed)
  const did = new DID({ provider, resolver: KeyResolver.getResolver() })
  await did.authenticate()
  FAUX_CONTEXT = { did: did } as Context
})

test('getIndexedModels()', async () => {
  const adminApi = new RemoteAdminApi(FAUX_ENDPOINT, FAUX_CONTEXT)
  // @ts-ignore
  adminApi.buildAuthorizationHeader = (): string => {
    return '<FAKE AUTH HEADER>'
  }
  const fauxFetch = jest.fn(async () => GET_RESPONSE) as typeof fetchJson
  (adminApi as any)._fetchJson = fauxFetch
  await adminApi.getIndexedModels()
  expect(fauxFetch).toBeCalledWith(new URL(`https://example.com/admin/models`), {"headers": {"Authorization:": "Basic <FAKE AUTH HEADER>"}})
})

test('addModelsToIndex()', async () => {
  const adminApi = new RemoteAdminApi(FAUX_ENDPOINT, FAUX_CONTEXT)
  // @ts-ignore
  adminApi.buildAuthorizationHeader = (): string => {
    return '<FAKE AUTH HEADER>'
  }
  const fauxFetch = jest.fn(async () => SUCCESS_RESPONSE) as typeof fetchJson
  (adminApi as any)._fetchJson = fauxFetch
  await adminApi.addModelsToIndex([MODEL])
  expect(fauxFetch).toBeCalledWith(
    new URL(`https://example.com/admin/models`),
    {
      headers: {"Authorization:": "Basic <FAKE AUTH HEADER>" },
      method: 'post',
      body: { models: [MODEL.toString()] },
    }
  )
})

test('removeModelsFromIndex()', async () => {
  const adminApi = new RemoteAdminApi(FAUX_ENDPOINT, FAUX_CONTEXT)
  // @ts-ignore
  adminApi.buildAuthorizationHeader = (): string => {
    return '<FAKE AUTH HEADER>'
  }
  const fauxFetch = jest.fn(async () => SUCCESS_RESPONSE) as typeof fetchJson
  (adminApi as any)._fetchJson = fauxFetch
  await adminApi.removeModelsFromIndex([MODEL])
  expect(fauxFetch).toBeCalledWith(
    new URL(`https://example.com/admin/models`),
    {
      headers: { "Authorization:": "Basic <FAKE AUTH HEADER>" },
      method: 'delete',
      body: { models: [MODEL.toString()] },
    }
  )
})

test('replaceModelsInIndex()', async () => {
  const adminApi = new RemoteAdminApi(FAUX_ENDPOINT, FAUX_CONTEXT)
  // @ts-ignore
  adminApi.buildAuthorizationHeader = (): string => {
    return '<FAKE AUTH HEADER>'
  }
  const fauxFetch = jest.fn(async () => SUCCESS_RESPONSE) as typeof fetchJson
  (adminApi as any)._fetchJson = fauxFetch
  await adminApi.replaceModelsInIndex([MODEL])
  expect(fauxFetch).toBeCalledWith(
    new URL(`https://example.com/admin/models`),
    {
      headers: { "Authorization:": "Basic <FAKE AUTH HEADER>" },
      method: 'put',
      body: { models: [MODEL.toString()] },
    }
  )
})
