import { DID } from 'dids'
import { StreamID } from '@ceramicnetwork/streamid'
import { fetchJson, TestUtils } from '@ceramicnetwork/common'
import { RemoteAdminApi } from '../remote-admin-api.js'
import { jest } from '@jest/globals'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import KeyResolver from 'key-did-resolver'
import { randomBytes } from '@stablelib/random'
import { MissingDIDError } from '../utils.js'

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
let noDidFn
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
  noDidFn = () => {
    return undefined
  }
  const didKeyVerStr = did.id.split('did:key:')[1]
  expectedKid = `${did.id}#${didKeyVerStr}`
})

test('nodeStatus()', async () => {
  const adminApi = new RemoteAdminApi(FAUX_ENDPOINT, getDidFn)
  const fauxFetch = jest.fn(async () => GET_RESPONSE) as typeof fetchJson
  ;(adminApi as any)._fetchJson = fauxFetch
  await adminApi.nodeStatus()

  expect(fauxFetch.mock.calls[0][0]).toEqual(new URL(`https://example.com/admin/getCode`))
  expect(fauxFetch.mock.calls[1][0]).toEqual(new URL(`https://example.com/admin/status`))
  const sentPayload = fauxFetch.mock.calls[1][1]
  const sentJws = sentPayload.headers.Authorization.split('Basic ')[1]

  const jwsResult = await did.verifyJWS(sentJws)
  expect(jwsResult.kid).toEqual(expectedKid)
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

test('startIndexingModels()', async () => {
  const adminApi = new RemoteAdminApi(FAUX_ENDPOINT, getDidFn)
  const fauxFetch = jest.fn(async () => GET_RESPONSE) as typeof fetchJson
  ;(adminApi as any)._fetchJson = fauxFetch
  await adminApi.startIndexingModels([MODEL])

  expect(fauxFetch.mock.calls[0][0]).toEqual(new URL(`https://example.com/admin/getCode`))
  expect(fauxFetch.mock.calls[1][0]).toEqual(new URL(`https://example.com/admin/models`))
})

test('startIndexingModelData()', async () => {
  const adminApi = new RemoteAdminApi(FAUX_ENDPOINT, getDidFn)
  const fauxFetch = jest.fn(async () => GET_RESPONSE) as typeof fetchJson
  ;(adminApi as any)._fetchJson = fauxFetch
  await adminApi.startIndexingModelData([{ streamID: MODEL }])

  expect(fauxFetch.mock.calls[0][0]).toEqual(new URL(`https://example.com/admin/getCode`))
  expect(fauxFetch.mock.calls[1][0]).toEqual(new URL(`https://example.com/admin/modelData`))
})

test('stopIndexingModels()', async () => {
  const adminApi = new RemoteAdminApi(FAUX_ENDPOINT, getDidFn)
  const fauxFetch = jest.fn(async () => GET_RESPONSE) as typeof fetchJson
  ;(adminApi as any)._fetchJson = fauxFetch
  await adminApi.stopIndexingModels([MODEL])

  expect(fauxFetch.mock.calls[0][0]).toEqual(new URL(`https://example.com/admin/getCode`))
  expect(fauxFetch.mock.calls[1][0]).toEqual(new URL(`https://example.com/admin/models`))
})

test('missingDidFailureCases', async () => {
  const fauxFetch = jest.fn(async () => GET_RESPONSE) as typeof fetchJson

  const failingAdminApi = new RemoteAdminApi(FAUX_ENDPOINT, noDidFn)
  ;(failingAdminApi as any)._fetchJson = fauxFetch

  await expect(failingAdminApi.getIndexedModels()).rejects.toThrow(MissingDIDError)

  await expect(failingAdminApi.stopIndexingModels()).rejects.toThrow(MissingDIDError)

  await expect(failingAdminApi.startIndexingModels()).rejects.toThrow(MissingDIDError)
})

test('addModelsToIndex', async () => {
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

test('addModelsToIndexWithFields', async () => {
  const adminApi = new RemoteAdminApi(FAUX_ENDPOINT, getDidFn)
  const fauxFetch = jest.fn(async () => SUCCESS_RESPONSE) as typeof fetchJson
  ;(adminApi as any)._fetchJson = fauxFetch
  const data = {
    streamID: MODEL,
    indices: [
      {
        fields: [
          {
            path: ['test'],
          },
        ],
      },
    ],
  }
  await adminApi.startIndexingModelData([data])
  expect(fauxFetch.mock.calls[0][0]).toEqual(new URL(`https://example.com/admin/getCode`))
  expect(fauxFetch.mock.calls[1][0]).toEqual(new URL(`https://example.com/admin/modelData`))
  const sentPayload = fauxFetch.mock.calls[1][1]
  expect(sentPayload.method).toEqual('post')
  const sentJws = sentPayload.body.jws

  const jwsResult = await did.verifyJWS(sentJws)
  expect(jwsResult.kid).toEqual(expectedKid)
  expect(jwsResult.payload.requestBody.modelData.length).toEqual(1)
  const resultData = jwsResult.payload.requestBody.modelData[0]
  expect(resultData.streamID).toEqual(data.streamID.toString())
  expect(resultData.indices).toBeDefined()
  expect(resultData.indices).toEqual(data.indices)
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

describe('Admin Pin API', () => {
  const STREAM = new StreamID(1, TestUtils.randomCID())

  test('pin.add(streamId)', async () => {
    const adminApi = new RemoteAdminApi(FAUX_ENDPOINT, getDidFn)
    const fauxFetch = jest.fn(async () => GET_RESPONSE) as typeof fetchJson
    ;(adminApi as any)._fetchJson = fauxFetch
    ;(adminApi as any).pin._fetchJson = fauxFetch
    await adminApi.pin.add(STREAM)

    expect(fauxFetch.mock.calls[0][0]).toEqual(new URL(`https://example.com/admin/getCode`))
    expect(fauxFetch.mock.calls[1][0]).toEqual(new URL(`https://example.com/admin/pins/${STREAM}`))

    const sentPayload = fauxFetch.mock.calls[1][1]
    const sentJws = sentPayload.headers.Authorization.split('Basic ')[1]

    const jwsResult = await did.verifyJWS(sentJws)
    expect(jwsResult.kid).toEqual(expectedKid)
  })

  test('pin.rm(streamId)', async () => {
    const adminApi = new RemoteAdminApi(FAUX_ENDPOINT, getDidFn)
    const fauxFetch = jest.fn(async () => GET_RESPONSE) as typeof fetchJson
    ;(adminApi as any)._fetchJson = fauxFetch
    ;(adminApi as any).pin._fetchJson = fauxFetch
    await adminApi.pin.rm(STREAM)

    expect(fauxFetch.mock.calls[0][0]).toEqual(new URL(`https://example.com/admin/getCode`))
    expect(fauxFetch.mock.calls[1][0]).toEqual(new URL(`https://example.com/admin/pins/${STREAM}`))

    const sentPayload = fauxFetch.mock.calls[1][1]
    const sentJws = sentPayload.headers.Authorization.split('Basic ')[1]

    const jwsResult = await did.verifyJWS(sentJws)
    expect(jwsResult.kid).toEqual(expectedKid)
  })

  test('pin.ls(streamId)', async () => {
    const adminApi = new RemoteAdminApi(FAUX_ENDPOINT, getDidFn)
    const fauxFetch = jest.fn(async () => GET_RESPONSE) as typeof fetchJson
    ;(adminApi as any)._fetchJson = fauxFetch
    ;(adminApi as any).pin._fetchJson = fauxFetch
    await adminApi.pin.ls(STREAM)

    expect(fauxFetch.mock.calls[0][0]).toEqual(new URL(`https://example.com/admin/getCode`))
    expect(fauxFetch.mock.calls[1][0]).toEqual(new URL(`https://example.com/admin/pins/${STREAM}`))

    const sentPayload = fauxFetch.mock.calls[1][1]
    const sentJws = sentPayload.headers.Authorization.split('Basic ')[1]

    const jwsResult = await did.verifyJWS(sentJws)
    expect(jwsResult.kid).toEqual(expectedKid)
  })

  test('pin.ls()', async () => {
    const adminApi = new RemoteAdminApi(FAUX_ENDPOINT, getDidFn)
    const fauxFetch = jest.fn(async () => GET_RESPONSE) as typeof fetchJson
    ;(adminApi as any)._fetchJson = fauxFetch
    ;(adminApi as any).pin._fetchJson = fauxFetch
    await adminApi.pin.ls()

    expect(fauxFetch.mock.calls[0][0]).toEqual(new URL(`https://example.com/admin/getCode`))
    expect(fauxFetch.mock.calls[1][0]).toEqual(new URL(`https://example.com/admin/pins`))

    const sentPayload = fauxFetch.mock.calls[1][1]
    const sentJws = sentPayload.headers.Authorization.split('Basic ')[1]

    const jwsResult = await did.verifyJWS(sentJws)
    expect(jwsResult.kid).toEqual(expectedKid)
  })

  test('missingDidFailureCases', async () => {
    const fauxFetch = jest.fn(async () => GET_RESPONSE) as typeof fetchJson

    const failingAdminApi = new RemoteAdminApi(FAUX_ENDPOINT, noDidFn)
    ;(failingAdminApi as any)._fetchJson = fauxFetch
    ;(failingAdminApi as any).pin._fetchJson = fauxFetch

    await expect(failingAdminApi.pin.add(STREAM)).rejects.toThrow(MissingDIDError)

    await expect(failingAdminApi.pin.rm(STREAM)).rejects.toThrow(MissingDIDError)

    await expect(failingAdminApi.pin.ls()).rejects.toThrow(MissingDIDError)
  })
})
