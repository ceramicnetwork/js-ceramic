import { describe, expect, jest, test } from '@jest/globals'
import { RemoteCAS } from '../remote-cas.js'
import { fetchJson, LoggerProvider, TestUtils } from '@ceramicnetwork/common'
import { AnchorRequestCarFileReader } from '../../anchor-request-car-file-reader.js'
import { generateFakeCarFile } from './generateFakeCarFile.js'
import { AnchorRequestStatusName, dateAsUnix } from '@ceramicnetwork/codecs'
import MockDate from 'mockdate'

const ANCHOR_SERVICE_URL = 'http://example.com'
const POLL_INTERVAL = 100
const LOGGER = new LoggerProvider().getDiagnosticsLogger()

describe('RemoteCAS supportedChains', () => {
  test('returns decoded supported chains on valid response', async () => {
    const fetchFn = jest.fn(async () => ({
      supportedChains: ['eip155:42'],
    })) as unknown as typeof fetchJson
    const cas = new RemoteCAS(LOGGER, ANCHOR_SERVICE_URL, fetchFn)

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
    const cas = new RemoteCAS(LOGGER, ANCHOR_SERVICE_URL, fetchFn)
    const supportedChains = await cas.supportedChains()
    expect(supportedChains).toEqual(['eip155:42'])
    expect(fetchFn).toBeCalledTimes(1)
    expect(fetchFn).toBeCalledWith(`${ANCHOR_SERVICE_URL}/api/v0/service-info/supported_chains`)
  })

  test('throws an error on invalid response format, format contains a list of two supported chains current codebase only handles logic for one', async () => {
    const fetchFn = jest.fn(async () => ({
      supportedChains: ['eip155:42', 'eip155:1'],
    })) as unknown as typeof fetchJson
    const cas = new RemoteCAS(LOGGER, ANCHOR_SERVICE_URL, fetchFn)
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
    const cas = new RemoteCAS(LOGGER, ANCHOR_SERVICE_URL, fetchFn)
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
    const casForNull = new RemoteCAS(LOGGER, ANCHOR_SERVICE_URL, fetchFnNull)
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
    const casForEmpty = new RemoteCAS(LOGGER, ANCHOR_SERVICE_URL, fetchFnEmpty)
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
    const cas = new RemoteCAS(LOGGER, ANCHOR_SERVICE_URL, fetchFn)
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
    const cas = new RemoteCAS(LOGGER, ANCHOR_SERVICE_URL, fetchFn)
    const carFileReader = new AnchorRequestCarFileReader(generateFakeCarFile())
    await expect(cas.create(carFileReader)).rejects.toThrow()
  })
})

describe('getStatusForRequest', () => {
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
      LOGGER,
      ANCHOR_SERVICE_URL,
      fetchJsonFn as unknown as typeof fetchJson
    )
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
    const cas = new RemoteCAS(
      LOGGER,
      ANCHOR_SERVICE_URL,
      fetchJsonFn as unknown as typeof fetchJson
    )
    const responseP = cas.getStatusForRequest(streamId, tip)
    await TestUtils.delay(POLL_INTERVAL)
    await cas.close()
    await expect(responseP).rejects.toThrow()
  })
})

describe('assertCASAccessible', () => {
  const carFileReader = new AnchorRequestCarFileReader(generateFakeCarFile())

  const fetchNetworkErrFn = jest.fn(() => {
    throw new Error(`Network error`)
  }) as unknown as typeof fetchJson

  afterEach(() => {
    MockDate.reset()
  })

  /**
   * Skips time forward enough to pass the threshold of how long RemoteCAS must
   * have failed to contact the CAS before it considers the CAS unreachable.
   */
  function advanceTime() {
    const twoMinutes = 2 * 60 * 1000 // in ms
    MockDate.set(new Date(new Date().valueOf() + twoMinutes).toISOString())
  }

  test('Starts accessible', async () => {
    const cas = new RemoteCAS(LOGGER, ANCHOR_SERVICE_URL, fetchNetworkErrFn)
    cas.assertCASAccessible()
  })

  describe('create failures', () => {
    test('Failures without time passing still accessible', async () => {
      const cas = new RemoteCAS(LOGGER, ANCHOR_SERVICE_URL, fetchNetworkErrFn)

      await expect(cas.create(carFileReader)).rejects.toThrow()
      await expect(cas.create(carFileReader)).rejects.toThrow()
      await expect(cas.create(carFileReader)).rejects.toThrow()
      await expect(cas.create(carFileReader)).rejects.toThrow()
      await expect(cas.create(carFileReader)).rejects.toThrow()

      cas.assertCASAccessible()
    })

    test('Time passing without sufficient failures still accessible', async () => {
      const cas = new RemoteCAS(LOGGER, ANCHOR_SERVICE_URL, fetchNetworkErrFn)

      await expect(cas.create(carFileReader)).rejects.toThrow()
      await expect(cas.create(carFileReader)).rejects.toThrow()
      advanceTime()

      cas.assertCASAccessible()
    })

    test('Time passing plus sufficient failures means inaccessible', async () => {
      const cas = new RemoteCAS(LOGGER, ANCHOR_SERVICE_URL, fetchNetworkErrFn)

      await expect(cas.create(carFileReader)).rejects.toThrow()
      await expect(cas.create(carFileReader)).rejects.toThrow()
      await expect(cas.create(carFileReader)).rejects.toThrow()
      advanceTime()

      expect(cas.assertCASAccessible.bind(cas)).toThrow(
        /Ceramic Anchor Service appears to be inaccessible/
      )
    })

    test('Recovers after single success', async () => {
      const casResponse = {
        id: 'foo',
        status: AnchorRequestStatusName.PENDING,
        streamId: carFileReader.streamId.toString(),
        cid: carFileReader.tip.toString(),
        message: 'Sending anchoring request',
        createdAt: dateAsUnix.encode(new Date()),
        updatedAt: dateAsUnix.encode(new Date()),
      }

      let fetchShouldFail = true
      const fetchFn = jest.fn(() => {
        if (fetchShouldFail) {
          throw new Error(`Network error`)
        } else {
          return Promise.resolve(casResponse)
        }
      }) as unknown as typeof fetchJson

      const cas = new RemoteCAS(LOGGER, ANCHOR_SERVICE_URL, fetchFn)

      await expect(cas.create(carFileReader)).rejects.toThrow()
      await expect(cas.create(carFileReader)).rejects.toThrow()
      await expect(cas.create(carFileReader)).rejects.toThrow()
      advanceTime()

      expect(cas.assertCASAccessible.bind(cas)).toThrow(
        /Ceramic Anchor Service appears to be inaccessible/
      )

      fetchShouldFail = false
      await expect(cas.create(carFileReader)).resolves.toEqual({
        status: AnchorRequestStatusName.PENDING,
        streamId: carFileReader.streamId,
        cid: carFileReader.tip,
        message: 'Sending anchoring request',
      })
      cas.assertCASAccessible()
    })
  })

  describe('getStatusForRequest failures', () => {
    const streamId = TestUtils.randomStreamID()
    const tip = TestUtils.randomCID()

    test('Failures without time passing still accessible', async () => {
      const cas = new RemoteCAS(LOGGER, ANCHOR_SERVICE_URL, fetchNetworkErrFn)

      await expect(cas.getStatusForRequest(streamId, tip)).rejects.toThrow()
      await expect(cas.getStatusForRequest(streamId, tip)).rejects.toThrow()
      await expect(cas.getStatusForRequest(streamId, tip)).rejects.toThrow()
      await expect(cas.getStatusForRequest(streamId, tip)).rejects.toThrow()
      await expect(cas.getStatusForRequest(streamId, tip)).rejects.toThrow()

      cas.assertCASAccessible()
    })

    test('Time passing without sufficient failures still accessible', async () => {
      const cas = new RemoteCAS(LOGGER, ANCHOR_SERVICE_URL, fetchNetworkErrFn)

      await expect(cas.getStatusForRequest(streamId, tip)).rejects.toThrow()
      await expect(cas.getStatusForRequest(streamId, tip)).rejects.toThrow()
      advanceTime()

      cas.assertCASAccessible()
    })

    test('Time passing plus sufficient failures means inaccessible', async () => {
      const cas = new RemoteCAS(LOGGER, ANCHOR_SERVICE_URL, fetchNetworkErrFn)

      await expect(cas.getStatusForRequest(streamId, tip)).rejects.toThrow()
      await expect(cas.getStatusForRequest(streamId, tip)).rejects.toThrow()
      await expect(cas.getStatusForRequest(streamId, tip)).rejects.toThrow()
      advanceTime()

      expect(cas.assertCASAccessible.bind(cas)).toThrow(
        /Ceramic Anchor Service appears to be inaccessible/
      )
    })

    test('Recovers after single success', async () => {
      const casResponse = {
        id: 'fake-id',
        status: AnchorRequestStatusName.PENDING,
        streamId: streamId.toString(),
        cid: tip.toString(),
        message: 'Sending anchoring request',
      }

      let fetchShouldFail = true
      const fetchFn = jest.fn(() => {
        if (fetchShouldFail) {
          throw new Error(`Network error`)
        } else {
          return Promise.resolve(casResponse)
        }
      }) as unknown as typeof fetchJson

      const cas = new RemoteCAS(LOGGER, ANCHOR_SERVICE_URL, fetchFn)

      await expect(cas.getStatusForRequest(streamId, tip)).rejects.toThrow()
      await expect(cas.getStatusForRequest(streamId, tip)).rejects.toThrow()
      await expect(cas.getStatusForRequest(streamId, tip)).rejects.toThrow()
      advanceTime()

      expect(cas.assertCASAccessible.bind(cas)).toThrow(
        /Ceramic Anchor Service appears to be inaccessible/
      )

      fetchShouldFail = false
      await expect(cas.getStatusForRequest(streamId, tip)).resolves.toEqual({
        status: casResponse.status,
        streamId: streamId,
        cid: tip,
        message: casResponse.message,
      })
      cas.assertCASAccessible()
    })
  })

  describe('mixed create and getStatusForRequest failures', () => {
    test('Time passing plus sufficient failures means inaccessible', async () => {
      const streamId = TestUtils.randomStreamID()
      const tip = TestUtils.randomCID()
      const cas = new RemoteCAS(LOGGER, ANCHOR_SERVICE_URL, fetchNetworkErrFn)

      await expect(cas.create(carFileReader)).rejects.toThrow()
      await expect(cas.getStatusForRequest(streamId, tip)).rejects.toThrow()
      advanceTime()
      await expect(cas.getStatusForRequest(streamId, tip)).rejects.toThrow()

      expect(cas.assertCASAccessible.bind(cas)).toThrow(
        /Ceramic Anchor Service appears to be inaccessible/
      )
    })
  })
})
