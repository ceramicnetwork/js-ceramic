import { test, describe, expect, afterEach, jest } from '@jest/globals'
import { fetchJson } from '../fetch-json.js'
import { toString } from 'uint8arrays/to-string'
import express, { Request, Response } from 'express'
import getPort from 'get-port'
import { BaseTestUtils as TestUtils } from '@ceramicnetwork/base-test-utils'

const RESPONSE = {
  hello: `world-${Math.random()}`,
}

const interceptFn = jest.fn()
let sendResponse = async (res: Response, signal: AbortSignal) => {
  res.send(JSON.stringify(RESPONSE))
}

let server
let endpoint

beforeAll(async () => {
  const port = await getPort()
  endpoint = `http://localhost:${port}`

  const app = express()
  app.use(express.text({ type: '*/*' }))
  app.all('/', async (req: Request, res: Response) => {
    interceptFn(req.body, req.headers)

    const controller = new AbortController()
    const signal = controller.signal
    req.on('close', () => {
      controller.abort()
    })

    await sendResponse(res, signal).catch((err) => {
      if (!signal.aborted) {
        throw err
      }
    })
  })
  server = app.listen(port)
})

afterAll(() => {
  server.close()
})

afterEach(() => {
  interceptFn.mockClear()
})

test('plain GET request', async () => {
  const response = await fetchJson(endpoint)
  expect(response).toEqual(RESPONSE)
})

describe('POST request', () => {
  test('json', async () => {
    const requestPayload = {
      hello: 'world',
    }
    const response = await fetchJson(endpoint, {
      method: 'POST',
      body: requestPayload,
    })
    expect(response).toEqual(RESPONSE)
    const requestBody = interceptFn.mock.calls[0][0] as any
    const requestHeaders = interceptFn.mock.calls[0][1] as any
    // Request is application/json by default
    expect(requestHeaders['content-type']).toEqual('application/json')
    // Request payload gets JSON-stringified
    expect(requestBody).toEqual(JSON.stringify(requestPayload))
  })

  test('not json, custom header', async () => {
    const body = new Uint8Array(Buffer.from('test'))
    const response = await fetchJson(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-strange',
      },
      body: body,
    })
    expect(response).toEqual(RESPONSE)
    // const requestParameters = interceptFn.mock.calls[0][0] as any
    const requestBody = interceptFn.mock.calls[0][0] as any
    const requestHeaders = interceptFn.mock.calls[0][1] as any
    // Request is not application/json if custom header is provided
    expect(requestHeaders['content-type']).toEqual('application/x-strange')
    // Request payload gets "stringified" by HTTP transport
    expect(requestBody).toEqual(toString(body))
  })
})

test('respect timeout', async () => {
  sendResponse = async (res: Response, signal: AbortSignal) => {
    await TestUtils.delay(1000, signal)
    res.send(JSON.stringify(RESPONSE))
  }
  const responseP = fetchJson(endpoint, { timeout: 300 })
  await expect(responseP).rejects.toThrow(/This operation was aborted/)
})

test('respect abort signal', async () => {
  sendResponse = async (res, signal: AbortSignal) => {
    await TestUtils.delay(1000, signal)
    res.send(JSON.stringify(RESPONSE))
  }
  const controller = new AbortController()
  const responseP = fetchJson(endpoint, { signal: controller.signal })
  await TestUtils.delay(200)
  controller.abort()
  await expect(responseP).rejects.toThrow(/This operation was aborted/)
})

test('throw when not ok', async () => {
  sendResponse = async (res) => {
    res.sendStatus(404)
  }

  const controller = new AbortController()
  const responseP = fetchJson(endpoint, { signal: controller.signal })
  await expect(responseP).rejects.toThrow(
    `HTTP request to '${endpoint}' failed with status 'Not Found': Not Found`
  )
})
