import { test, describe, expect, afterEach, jest } from '@jest/globals'
import HttpRequestMock from 'http-request-mock'
import { fetchJson } from '../fetch-json.js'
import { toString } from 'uint8arrays/to-string'
import { TestUtils } from '../test-utils.js'

const mocker = HttpRequestMock.setup()
const ENDPOINT = `http://example-${Math.floor(Math.random() * 1000)}.com/api`
const RESPONSE = {
  hello: `world-${Math.random()}`,
}

afterEach(() => {
  mocker.reset()
})

test('plain GET request', async () => {
  mocker.mock({
    url: ENDPOINT,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(RESPONSE),
  })
  const response = await fetchJson(ENDPOINT)
  expect(response).toEqual(RESPONSE)
})

describe('POST request', () => {
  test('json', async () => {
    const interceptFn = jest.fn()
    mocker.mock({
      url: ENDPOINT,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: async (req) => {
        interceptFn(req)
        return JSON.stringify(RESPONSE)
      },
    })
    const requestPayload = {
      hello: 'world',
    }
    const response = await fetchJson(ENDPOINT, {
      method: 'POST',
      body: requestPayload,
    })
    expect(response).toEqual(RESPONSE)
    const requestParameters = interceptFn.mock.calls[0][0] as any
    // Request is application/json by default
    expect(requestParameters.headers['content-type']).toEqual('application/json')
    // Request payload gets JSON-stringified
    expect(requestParameters.body).toEqual(JSON.stringify(requestPayload))
  })

  test('not json, custom header', async () => {
    const interceptFn = jest.fn()
    mocker.mock({
      url: ENDPOINT,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: async (req) => {
        interceptFn(req)
        return JSON.stringify(RESPONSE)
      },
    })
    const body = new Uint8Array([1, 2, 3])
    const response = await fetchJson(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-strange',
      },
      body: body,
    })
    expect(response).toEqual(RESPONSE)
    const requestParameters = interceptFn.mock.calls[0][0] as any
    // Request is not application/json if custom header is provided
    expect(requestParameters.headers['content-type']).toEqual('application/x-strange')
    // Request payload gets "stringified" by HTTP transport
    expect(requestParameters.body).toEqual(toString(body))
  })
})

test('respect timeout', async () => {
  mocker.mock({
    url: ENDPOINT,
    method: 'GET',
    delay: 2000,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(RESPONSE),
  })
  const responseP = fetchJson(ENDPOINT, { timeout: 300 })
  await expect(responseP).rejects.toThrow(/The user aborted a request/)
})

test('respect abort signal', async () => {
  mocker.mock({
    url: ENDPOINT,
    method: 'GET',
    delay: 2000,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(RESPONSE),
  })
  const controller = new AbortController()
  const responseP = fetchJson(ENDPOINT, { signal: controller.signal })
  await TestUtils.delay(200)
  controller.abort()
  await expect(responseP).rejects.toThrow(/The user aborted a request/)
})

test('throw when not ok', async () => {
  mocker.mock({
    url: ENDPOINT,
    method: 'GET',
    status: 404,
    body: 'Absent!',
  })
  const controller = new AbortController()
  const responseP = fetchJson(ENDPOINT, { signal: controller.signal })
  await expect(responseP).rejects.toThrow(
    `HTTP request to '${ENDPOINT}' failed with status 'Not Found': Absent!`
  )
})
