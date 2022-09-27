import { StreamID } from '@ceramicnetwork/streamid'
import { fetchJson, TestUtils } from '@ceramicnetwork/common'
import { RemoteAdminApi } from '../remote-admin-api.js'
import { jest } from '@jest/globals'

const FAUX_ENDPOINT = new URL('https://example.com')
const MODEL = new StreamID(1, TestUtils.randomCID())
const SUCCESS_RESPONSE = {
  result: 'success'
}
const GET_RESPONSE = {
  models: [MODEL.toString()]
}

test('getIndexedModels()', async () => {
  const adminApi = new RemoteAdminApi(FAUX_ENDPOINT)
  const fauxFetch = jest.fn(async () => GET_RESPONSE) as typeof fetchJson
  (adminApi as any)._fetchJson = fauxFetch
  await adminApi.getIndexedModels()
  expect(fauxFetch).toBeCalledWith(new URL(`https://example.com/admin/models`))
})

test('addModelsToIndex()', async () => {
  const adminApi = new RemoteAdminApi(FAUX_ENDPOINT)
  const fauxFetch = jest.fn(async () => SUCCESS_RESPONSE) as typeof fetchJson
  (adminApi as any)._fetchJson = fauxFetch
  await adminApi.startIndexingModels([MODEL])
  expect(fauxFetch).toBeCalledWith(
    new URL(`https://example.com/admin/models`),
    {
      method: 'post',
      body: { models: [MODEL.toString()] },
    }
  )
})

test('removeModelsFromIndex()', async () => {
  const adminApi = new RemoteAdminApi(FAUX_ENDPOINT)
  const fauxFetch = jest.fn(async () => SUCCESS_RESPONSE) as typeof fetchJson
  (adminApi as any)._fetchJson = fauxFetch
  await adminApi.stopIndexingModels([MODEL])
  expect(fauxFetch).toBeCalledWith(
    new URL(`https://example.com/admin/models`),
    {
      method: 'delete',
      body: { models: [MODEL.toString()] },
    }
  )
})

test('replaceModelsInIndex()', async () => {
  const adminApi = new RemoteAdminApi(FAUX_ENDPOINT)
  const fauxFetch = jest.fn(async () => SUCCESS_RESPONSE) as typeof fetchJson
  (adminApi as any)._fetchJson = fauxFetch
  await adminApi.replaceIndexedModels([MODEL])
  expect(fauxFetch).toBeCalledWith(
    new URL(`https://example.com/admin/models`),
    {
      method: 'put',
      body: { models: [MODEL.toString()] },
    }
  )
})
