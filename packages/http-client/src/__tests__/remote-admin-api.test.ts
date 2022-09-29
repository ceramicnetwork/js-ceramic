import { DID } from 'dids'
import { StreamID } from '@ceramicnetwork/streamid'
import { fetchJson, TestUtils } from '@ceramicnetwork/common'
import { RemoteAdminApi } from '../remote-admin-api.js'
import { jest } from '@jest/globals'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import KeyResolver from 'key-did-resolver'
import { randomBytes } from '@stablelib/random'

const FAUX_ENDPOINT = new URL('https://example.com')
const FAUX_ADMIN_CODE = '<FAUX-ADMIN-CODE>'
const MODEL = new StreamID(1, TestUtils.randomCID())
const SUCCESS_RESPONSE = {
  result: 'success'
}
const GET_RESPONSE = {
  models: [MODEL.toString()]
}

let did: DID

beforeAll(async () => {
  const seed = randomBytes(32)
  const provider = new Ed25519Provider(seed)
  const actingDid = new DID({ provider, resolver: KeyResolver.getResolver() })
  await actingDid.authenticate()
  did = actingDid
})

test('getIndexedModels()', async () => {
  const adminApi = new RemoteAdminApi(FAUX_ENDPOINT)
  // @ts-ignore
  adminApi.buildAuthorizationHeader = (): string => {
    return '<FAKE AUTH HEADER>'
  }
  const fauxFetch = jest.fn(async () => GET_RESPONSE) as typeof fetchJson
  (adminApi as any)._fetchJson = fauxFetch
  await adminApi.getIndexedModels(did, FAUX_ADMIN_CODE)
  expect(fauxFetch).toBeCalledWith(new URL(`https://example.com/admin/models`), {"headers": {"Authorization:": "Basic <FAKE AUTH HEADER>"}})
})

test('addModelsToIndex()', async () => {
  const adminApi = new RemoteAdminApi(FAUX_ENDPOINT)
  // @ts-ignore
  adminApi.buildAuthorizationHeader = (): string => {
    return '<FAKE AUTH HEADER>'
  }
  const fauxFetch = jest.fn(async () => SUCCESS_RESPONSE) as typeof fetchJson
  (adminApi as any)._fetchJson = fauxFetch
  await adminApi.startIndexingModels(did, FAUX_ADMIN_CODE, [MODEL])
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
  const adminApi = new RemoteAdminApi(FAUX_ENDPOINT)
  // @ts-ignore
  adminApi.buildAuthorizationHeader = (): string => {
    return '<FAKE AUTH HEADER>'
  }
  const fauxFetch = jest.fn(async () => SUCCESS_RESPONSE) as typeof fetchJson
  (adminApi as any)._fetchJson = fauxFetch
  await adminApi.stopIndexingModels(did, FAUX_ADMIN_CODE, [MODEL])
  expect(fauxFetch).toBeCalledWith(
    new URL(`https://example.com/admin/models`),
    {
      headers: { "Authorization:": "Basic <FAKE AUTH HEADER>" },
      method: 'delete',
      body: { models: [MODEL.toString()] },
    }
  )
})
