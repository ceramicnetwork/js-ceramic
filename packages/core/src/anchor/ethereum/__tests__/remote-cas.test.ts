import { describe, expect, jest, test } from '@jest/globals'
import { RemoteCAS } from '../remote-cas.js'
import { fetchJson, LoggerProvider, TestUtils } from '@ceramicnetwork/common'
import { AnchorRequestCarFileReader } from '../../anchor-request-car-file-reader.js'
import { generateFakeCarFile } from './generateFakeCarFile.js'
import { AnchorRequestStatusName, dateAsUnix } from '@ceramicnetwork/codecs'

const ANCHOR_SERVICE_URL = 'http://example.com'
const LOGGER = new LoggerProvider().getDiagnosticsLogger()
const POLL_INTERVAL = 100
const MAX_POLL_TIME = 1000

test('supportedChains', async () => {
  const fetchFn = jest.fn(async () => {
    return {
      supportedChains: ['eip155:42'],
    }
  }) as unknown as typeof fetchJson
  const cas = new RemoteCAS(ANCHOR_SERVICE_URL, LOGGER, POLL_INTERVAL, MAX_POLL_TIME, fetchFn)
  const supportedChains = await cas.supportedChains()
  expect(supportedChains).toEqual(['eip155:42'])
  expect(fetchFn).toBeCalledTimes(1)
  expect(fetchFn).toBeCalledWith(`${ANCHOR_SERVICE_URL}/api/v0/service-info/supported_chains`)
})

describe('create', () => {
  test('return pending, do no request', async () => {
    const fetchFn = jest.fn() as unknown as typeof fetchJson
    const cas = new RemoteCAS(ANCHOR_SERVICE_URL, LOGGER, POLL_INTERVAL, MAX_POLL_TIME, fetchFn)
    const carFileReader = new AnchorRequestCarFileReader(generateFakeCarFile())
    const result = await cas.create(carFileReader, false)
    expect(fetchFn).not.toBeCalled()
    expect(result).toEqual({
      status: AnchorRequestStatusName.PENDING,
      streamId: carFileReader.streamId,
      cid: carFileReader.tip,
      message: 'Sending anchoring request',
    })
  })

  // stubborn create
  test('waitForConfirmation on', async () => {
    const maxAttempts = 10
    const carFileReader = new AnchorRequestCarFileReader(generateFakeCarFile())

    let n = 1
    const fetchJsonFn = jest.fn().mockImplementation(async () => {
      if (n < maxAttempts) {
        n += 1
        throw new Error(`No connection`)
      } else {
        return {
          id: 'foo',
          status: AnchorRequestStatusName.PENDING,
          streamId: carFileReader.streamId.toString(),
          cid: carFileReader.tip.toString(),
          message: 'Sending anchoring request',
          createdAt: dateAsUnix.encode(new Date()),
          updatedAt: dateAsUnix.encode(new Date()),
        }
      }
    })
    const cas = new RemoteCAS(
      ANCHOR_SERVICE_URL,
      LOGGER,
      POLL_INTERVAL,
      MAX_POLL_TIME,
      fetchJsonFn as unknown as typeof fetchJson
    )
    const response = await cas.create(carFileReader, true)
    expect(response).toEqual({
      status: AnchorRequestStatusName.PENDING,
      streamId: carFileReader.streamId,
      cid: carFileReader.tip,
      message: 'Sending anchoring request',
    })
    expect(fetchJsonFn).toBeCalledTimes(maxAttempts)
  })

  test('waitForConfirmation on, stop', async () => {
    const carFileReader = new AnchorRequestCarFileReader(generateFakeCarFile())
    let n = 0
    const fetchJsonFn = jest.fn().mockImplementation(async () => {
      n += 1
      throw new Error(`No connection`)
    })
    const cas = new RemoteCAS(
      ANCHOR_SERVICE_URL,
      LOGGER,
      POLL_INTERVAL,
      MAX_POLL_TIME,
      fetchJsonFn as unknown as typeof fetchJson
    )
    const responseP = cas.create(carFileReader, true)
    await TestUtils.delay(POLL_INTERVAL * 3)
    await cas.close()
    expect(fetchJsonFn).toBeCalledTimes(n)
    await expect(responseP).rejects.toThrow()
  })
})

describe('get', () => {
  test('retrieve anchor status', async () => {
    const streamId = TestUtils.randomStreamID()
    const tip = TestUtils.randomCID()
    const casResponse = {
      id: 'fake-id',
      status: AnchorRequestStatusName.PENDING,
      streamId: streamId.toString(),
      cid: tip.toString(),
      message: 'Sending anchoring request',
    }
    const fetchJsonFn = jest.fn().mockImplementation(async () => {
      return casResponse
    })
    const cas = new RemoteCAS(
      ANCHOR_SERVICE_URL,
      LOGGER,
      POLL_INTERVAL,
      MAX_POLL_TIME,
      fetchJsonFn as unknown as typeof fetchJson
    )
    const response = await cas.get(streamId, tip)
    expect(response).toEqual({
      status: casResponse.status,
      streamId: streamId,
      cid: tip,
      message: casResponse.message,
    })
    expect(fetchJsonFn).toBeCalled()
    const fetchJsonOpts = fetchJsonFn.mock.lastCall[1] as any
    expect(fetchJsonOpts.timeout).toEqual(POLL_INTERVAL)
  })

  test('emit abort signal on global stop', async () => {
    const streamId = TestUtils.randomStreamID()
    const tip = TestUtils.randomCID()
    const fetchJsonFn = jest
      .fn()
      .mockImplementation(async (_, options: { signal: AbortSignal }) => {
        return TestUtils.delay(POLL_INTERVAL * 10, options.signal)
      })
    const cas = new RemoteCAS(
      ANCHOR_SERVICE_URL,
      LOGGER,
      POLL_INTERVAL,
      MAX_POLL_TIME,
      fetchJsonFn as unknown as typeof fetchJson
    )
    const responseP = cas.get(streamId, tip)
    await TestUtils.delay(POLL_INTERVAL)
    await cas.close()
    await expect(responseP).rejects.toThrow()
  })
})
