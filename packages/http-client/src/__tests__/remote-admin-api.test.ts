import { DID } from 'dids'
import { StreamID } from '@ceramicnetwork/streamid'
import { fetchJson, TestUtils } from '@ceramicnetwork/common'
import { RemoteAdminApi } from '../remote-admin-api.js'
import { jest } from '@jest/globals'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import KeyResolver from 'key-did-resolver'
import { randomBytes } from '@stablelib/random'

const FAUX_ENDPOINT = new URL('https://example.com')
const MODEL = new StreamID(1, TestUtils.randomCID())
const SUCCESS_RESPONSE = {
  result: 'success',
}
const GET_RESPONSE = {
  models: [MODEL.toString()],
}

let did: DID
let getDidFn
let expectedKid: string

beforeAll(async () => {
  const seed = randomBytes(32)
  const provider = new Ed25519Provider(seed)
  const actingDid = new DID({ provider, resolver: KeyResolver.getResolver() })
  await actingDid.authenticate()
  did = actingDid
  getDidFn = () => {
    return did
  }
  const didKeyVerStr = did.id.split('did:key:')[1]
  expectedKid = `${did.id}#${didKeyVerStr}`
})

test('getIndexedModels()', async () => {
  const adminApi = new RemoteAdminApi(FAUX_ENDPOINT, getDidFn)
  const fauxFetch = jest.fn(async () => GET_RESPONSE) as typeof fetchJson
  ;(adminApi as any)._fetchJson = fauxFetch
  await adminApi.getIndexedModels()

  expect(fauxFetch.mock.calls[0][0]).toEqual(new URL(`https://example.com/admin/getCode`))
  expect(fauxFetch.mock.calls[1][0]).toEqual(new URL(`https://example.com/admin/models`))
  const sentPayload = fauxFetch.mock.calls[1][1]
  const sentJws = sentPayload.headers.Authorization.split('Basic ')[1]

  const jwsResult = await did.verifyJWS(sentJws)
  expect(jwsResult.kid).toEqual(expectedKid)
})

test('addModelsToIndex()', async () => {
  const adminApi = new RemoteAdminApi(FAUX_ENDPOINT, getDidFn)
  const fauxFetch = jest.fn(async () => SUCCESS_RESPONSE) as typeof fetchJson
  ;(adminApi as any)._fetchJson = fauxFetch
  await adminApi.startIndexingModels([MODEL])
  expect(fauxFetch.mock.calls[0][0]).toEqual(new URL(`https://example.com/admin/getCode`))
  expect(fauxFetch.mock.calls[1][0]).toEqual(new URL(`https://example.com/admin/models`))
  const sentPayload = fauxFetch.mock.calls[1][1]
  expect(sentPayload.method).toEqual('post')
  const sentJws = sentPayload.body.jws

  const jwsResult = await did.verifyJWS(sentJws)
  expect(jwsResult.kid).toEqual(expectedKid)
  expect(jwsResult.payload.requestBody.models.length).toEqual(1)
  expect(jwsResult.payload.requestBody.models[0]).toEqual(MODEL.toString())
})

test('removeModelsFromIndex()', async () => {
  const adminApi = new RemoteAdminApi(FAUX_ENDPOINT, getDidFn)
  const fauxFetch = jest.fn(async () => SUCCESS_RESPONSE) as typeof fetchJson
  ;(adminApi as any)._fetchJson = fauxFetch
  await adminApi.stopIndexingModels([MODEL])
  expect(fauxFetch.mock.calls[0][0]).toEqual(new URL(`https://example.com/admin/getCode`))
  expect(fauxFetch.mock.calls[1][0]).toEqual(new URL(`https://example.com/admin/models`))
  const sentPayload = fauxFetch.mock.calls[1][1]
  expect(sentPayload.method).toEqual('delete')
  const sentJws = sentPayload.body.jws

  const jwsResult = await did.verifyJWS(sentJws)
  expect(jwsResult.kid).toEqual(expectedKid)
  expect(jwsResult.payload.requestBody.models.length).toEqual(1)
  expect(jwsResult.payload.requestBody.models[0]).toEqual(MODEL.toString())
})
