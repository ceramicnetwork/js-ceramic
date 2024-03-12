import { ReconApi, ReconApiConfig } from '../recon.js'
import { EventID, StreamID } from '@ceramicnetwork/streamid'
import { FetchRequest, LoggerProvider } from '@ceramicnetwork/common'
import { jest } from '@jest/globals'
import { type CAR } from 'cartonne'
import { toArray, take, lastValueFrom, firstValueFrom, race, timer } from 'rxjs'

const RECON_URL = 'http://example.com'
const LOGGER = new LoggerProvider().getDiagnosticsLogger()
const MODEL = StreamID.fromString('kjzl6cwe1jw147ww5d8pswh1hjh686mut8v1br10dar8l9a3n1t8l15l0vrzn88')
const FAKE_EVENT = { id: EventID.createRandom('inmemory', 0), data: {} as CAR }

describe('ReconApi', () => {
  let mockSendRequest: jest.Mock<FetchRequest>
  let reconApi: ReconApi

  beforeEach(async () => {
    mockSendRequest = jest.fn((url: URL | string): Promise<any> => {
      url = url.toString()
      if (url.includes('/ceramic/feed/events')) {
        return Promise.resolve({
          events: [{ id: EventID.createRandom('inmemory', 0).toString(), data: undefined }],
          resumeToken: 'test',
        })
      }
      return Promise.resolve()
    })

    reconApi = new ReconApi(
      {
        enabled: true,
        url: RECON_URL,
        feedEnabled: true,
      },
      LOGGER,
      mockSendRequest
    )
    await reconApi.init()
    mockSendRequest.mockClear()
  })

  afterEach(async () => {
    await reconApi.stop()
  })

  describe('init', () => {
    test('should not init if recon is disabled', async () => {
      const mockSendRequest = jest.fn(() => Promise.resolve())
      const reconApi = new ReconApi(
        { enabled: false, url: RECON_URL, feedEnabled: true },
        LOGGER,
        mockSendRequest
      )
      await reconApi.init()
      expect(mockSendRequest).not.toHaveBeenCalled()
    })

    test('should not init if already initialized', async () => {
      // already initialized in beforeEach
      await reconApi.init()

      expect(mockSendRequest).not.toHaveBeenCalled()
    })

    test('should not start polling if feed is disabled', async () => {
      const mockSendRequest = jest.fn(() => Promise.resolve())
      const reconApi = new ReconApi(
        { enabled: true, url: RECON_URL, feedEnabled: false },
        LOGGER,
        mockSendRequest
      )
      await reconApi.init()
      await firstValueFrom(race(reconApi, timer(1000)))
      expect(mockSendRequest).toHaveBeenCalledTimes(1)
    })
  })

  describe('registerInterest', () => {
    test('should throw if recon is disabled', async () => {
      const reconApi = new ReconApi(
        { enabled: false, url: RECON_URL, feedEnabled: true },
        LOGGER,
        mockSendRequest
      )
      await expect(reconApi.registerInterest(MODEL)).rejects.toThrow(
        'Recon: disabled, not registering interest in model kjzl6cwe1jw147ww5d8pswh1hjh686mut8v1br10dar8l9a3n1t8l15l0vrzn88'
      )
    })

    test('should be able to register interest in a model', async () => {
      await reconApi.registerInterest(MODEL)
      expect(mockSendRequest).toHaveBeenCalledWith(
        `${RECON_URL}/ceramic/interests/model/${MODEL.toString()}`,
        { method: 'POST' }
      )
    })
  })

  describe('put', () => {
    test('should do nothing if recon is disabled', async () => {
      const mockSendRequest = jest.fn(() => Promise.resolve())
      const reconApi = new ReconApi(
        { enabled: false, url: RECON_URL, feedEnabled: true },
        LOGGER,
        mockSendRequest
      )
      await expect(reconApi.put(FAKE_EVENT)).resolves
      expect(mockSendRequest).not.toHaveBeenCalled()
    })

    test('put should put an event to the Recon API', async () => {
      await reconApi.put(FAKE_EVENT, {})

      expect(mockSendRequest).toHaveBeenCalledWith(`${RECON_URL}/ceramic/events`, {
        method: 'POST',
        body: { id: FAKE_EVENT.id.toString(), data: FAKE_EVENT.data.toString() },
      })
    })
  })

  describe('feed', () => {
    test('should be able to subscribe to recon api as event feed', async () => {
      let resumeToken = 0
      mockSendRequest.mockImplementation(async () => {
        resumeToken = resumeToken + 1
        return {
          events: [{ id: EventID.createRandom('inmemory', 0).toString(), data: undefined }],
          resumeToken: resumeToken.toString(),
        }
      })
      const received = await lastValueFrom(reconApi.pipe(take(3), toArray()))

      expect(received.length).toEqual(3)
      expect(received[0].cursor).toEqual('1')
      expect(received[1].cursor).toEqual('2')
      expect(received[2].cursor).toEqual('3')
    })

    test('should be resilient to errors', async () => {
      let resumeToken = 100
      mockSendRequest.mockImplementation(async () => {
        resumeToken = resumeToken + 1

        if (resumeToken == 102) throw Error('transient error')

        return {
          events: [{ id: EventID.createRandom('inmemory', 0).toString(), data: undefined }],
          resumeToken: resumeToken.toString(),
        }
      })

      const received = await lastValueFrom(reconApi.pipe(take(3), toArray()))

      expect(received.length).toEqual(3)
      expect(received[0].cursor).toEqual('101')
      expect(received[1].cursor).toEqual('103')
      expect(received[2].cursor).toEqual('104')
    })
  })
})
