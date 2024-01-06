import { describe, expect, jest, test } from '@jest/globals'
import { RemoteCAS } from '../remote-cas.js'
import { fetchJson } from '@ceramicnetwork/common'
import { CommonTestUtils as TestUtils } from '@ceramicnetwork/common-test-utils'
import { AnchorRequestCarFileReader } from '../../anchor-request-car-file-reader.js'
import { generateFakeCarFile } from './generateFakeCarFile.js'
import { AnchorRequestStatusName, dateAsUnix } from '@ceramicnetwork/codecs'

const ANCHOR_SERVICE_URL = 'http://example.com'
const POLL_INTERVAL = 100

describe('RemoteCAS supportedChains', () => {
  test('returns decoded supported chains on valid response', async () => {
    const fetchFn = jest.fn(async () => ({
      supportedChains: ['eip155:42'],
    })) as unknown as typeof fetchJson
    const cas = new RemoteCAS(ANCHOR_SERVICE_URL, fetchFn)

    const supportedChains = await cas.supportedChains()
    expect(supportedChains).toEqual(['eip155:42'])
    expect(fetchFn).toBeCalledTimes(1)
    expect(fetchFn).toBeCalledWith(`${ANCHOR_SERVICE_URL}/api/v0/service-info/supported_chains`)
  })

  test('returns decoded supported chains on a response that contains the field supportedChains', async () => {
    const fetchFn = jest.fn(async () => ({
      someOtherField: 'SomeOtherContent',
      supportedChains: ['eip155:42'],
    })) as unknown as typeof fetchJson
    const cas = new RemoteCAS(ANCHOR_SERVICE_URL, fetchFn)
    const supportedChains = await cas.supportedChains()
    expect(supportedChains).toEqual(['eip155:42'])
    expect(fetchFn).toBeCalledTimes(1)
    expect(fetchFn).toBeCalledWith(`${ANCHOR_SERVICE_URL}/api/v0/service-info/supported_chains`)
  })

  test('throws an error on invalid response format, format contains a list of two supported chains current codebase only handles logic for one', async () => {
    const fetchFn = jest.fn(async () => ({
      supportedChains: ['eip155:42', 'eip155:1'],
    })) as unknown as typeof fetchJson
    const cas = new RemoteCAS(ANCHOR_SERVICE_URL, fetchFn)
    await expect(cas.supportedChains()).rejects.toThrow(
      `SupportedChains response : ${JSON.stringify({
        supportedChains: ['eip155:42', 'eip155:1'],
      })} does not contain contain the field <supportedChains> or is of size more than 1`
    )
  })

  test('throws an error on invalid response format, format contains a field other than `supportedChains`', async () => {
    const fetchFn = jest.fn(async () => ({
      incorrectFieldName: ['eip155:42'],
    })) as unknown as typeof fetchJson
    const cas = new RemoteCAS(ANCHOR_SERVICE_URL, fetchFn)
    await expect(cas.supportedChains()).rejects.toThrow(
      `SupportedChains response : ${JSON.stringify({
        incorrectFieldName: ['eip155:42'],
      })} does not contain contain the field <supportedChains> or is of size more than 1`
    )
  })

  test('throws an error on invalid response format, format contains null or empty supportedChains value', async () => {
    const fetchFnNull = jest.fn(async () => ({
      supportedChains: null,
    })) as unknown as typeof fetchJson
    const casForNull = new RemoteCAS(ANCHOR_SERVICE_URL, fetchFnNull)
    const expectedErrorNull =
      'Error: Invalid value null supplied to /(SupportedChainsResponse)/supportedChains(supportedChains)'
    await expect(casForNull.supportedChains()).rejects.toThrow(
      `SupportedChains response : ${JSON.stringify({
        supportedChains: null,
      })} does not contain contain the field <supportedChains> or is of size more than 1: ${expectedErrorNull}`
    )

    const fetchFnEmpty = jest.fn(async () => ({
      supportedChains: [],
    })) as unknown as typeof fetchJson
    const casForEmpty = new RemoteCAS(ANCHOR_SERVICE_URL, fetchFnEmpty)
    const expectedErrorUndefined = `Error: Invalid value [] supplied to /(SupportedChainsResponse)/supportedChains(supportedChains)`
    await expect(casForEmpty.supportedChains()).rejects.toThrow(
      `SupportedChains response : ${JSON.stringify({
        supportedChains: [],
      })} does not contain contain the field <supportedChains> or is of size more than 1: ${expectedErrorUndefined}`
    )
  })
})
describe('create', () => {
  test('return pending, do request', async () => {
    const fetchFn = jest.fn(() =>
      Promise.resolve({
        id: 'foo',
        status: AnchorRequestStatusName.PENDING,
        streamId: carFileReader.streamId.toString(),
        cid: carFileReader.tip.toString(),
        message: 'Sending anchoring request',
        createdAt: dateAsUnix.encode(new Date()),
        updatedAt: dateAsUnix.encode(new Date()),
      })
    ) as unknown as typeof fetchJson
    const cas = new RemoteCAS(ANCHOR_SERVICE_URL, fetchFn)
    const carFileReader = new AnchorRequestCarFileReader(generateFakeCarFile())
    const result = await cas.create(carFileReader)
    expect(fetchFn).toBeCalled()
    expect(result).toEqual({
      status: AnchorRequestStatusName.PENDING,
      streamId: carFileReader.streamId,
      cid: carFileReader.tip,
      message: 'Sending anchoring request',
    })
  })

  test('return pending, throw error', async () => {
    const fetchFn = jest.fn(async () => {
      throw new Error(`Oops`)
    }) as unknown as typeof fetchJson
    const cas = new RemoteCAS(ANCHOR_SERVICE_URL, fetchFn)
    const carFileReader = new AnchorRequestCarFileReader(generateFakeCarFile())
    await expect(cas.create(carFileReader)).rejects.toThrow()
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
    const cas = new RemoteCAS(ANCHOR_SERVICE_URL, fetchJsonFn as unknown as typeof fetchJson)
    const response = await cas.getStatusForRequest(streamId, tip)
    expect(response).toEqual({
      status: casResponse.status,
      streamId: streamId,
      cid: tip,
      message: casResponse.message,
    })
    expect(fetchJsonFn).toBeCalled()
  })

  test('emit abort signal on global stop', async () => {
    const streamId = TestUtils.randomStreamID()
    const tip = TestUtils.randomCID()
    const fetchJsonFn = jest
      .fn()
      .mockImplementation(async (_, options: { signal: AbortSignal }) => {
        return TestUtils.delay(POLL_INTERVAL * 10, options.signal)
      })
    const cas = new RemoteCAS(ANCHOR_SERVICE_URL, fetchJsonFn as unknown as typeof fetchJson)
    const responseP = cas.getStatusForRequest(streamId, tip)
    await TestUtils.delay(POLL_INTERVAL)
    await cas.close()
    await expect(responseP).rejects.toThrow()
  })
})
