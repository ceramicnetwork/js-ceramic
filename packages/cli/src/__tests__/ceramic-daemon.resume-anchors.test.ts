import { Repository } from '@ceramicnetwork/core'
import { jest } from '@jest/globals'
import { IpfsApi, Networks, TestUtils } from '@ceramicnetwork/common'
import { CeramicDaemon } from '../ceramic-daemon.js'
import { StateStoreMode } from '../daemon-config.js'
import tmp from 'tmp-promise'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { IpfsConnectionFactory } from '../ipfs-connection-factory.js'

const MOCK_WAS_CALLED_DELAY = 3 * 1000

describe('Ceramic Daemon Anchor Resuming', () => {
  const origBuildIpfs = IpfsConnectionFactory.buildIpfsConnection
  let mockWasCalled: boolean
  let stateStoreDir: tmp.DirectoryResult
  let daemon: CeramicDaemon

  beforeAll(async () => {
    const mocked = jest.fn()
    mocked.mockImplementation(async (): Promise<IpfsApi> => {
      return await createIPFS()
    })
    ;(IpfsConnectionFactory as any).buildIpfsConnection = mocked
    stateStoreDir = await tmp.dir({ unsafeCleanup: true })
  })

  beforeEach(() => {
    jest
      .spyOn(Repository.prototype, 'resumeRunningStatesFromAnchorRequestStore')
      .mockImplementation(() => {
        return new Promise<void>(() => {
          setTimeout(() => {
            mockWasCalled = true
          }, MOCK_WAS_CALLED_DELAY)
        })
      })
  })

  afterEach(async () => {
    await daemon.close()
    await stateStoreDir.cleanup()
  })

  afterAll(() => {
    (IpfsConnectionFactory as any).buildIpfsConnection = origBuildIpfs
  })

  it('Resume method is called when initialized with create()', async () => {
    daemon = await CeramicDaemon.create({
      network: {
        name: Networks.INMEMORY
      },
      anchor: {},
      httpApi: {},
      ipfs: {},
      logger: {},
      metrics: {},
      node: {},
      stateStore: {
        mode: StateStoreMode.FS,
        localDirectory: stateStoreDir.path
      }
    })
    expect(daemon).not.toBeNull()
    // resumeRunningStatesFromAnchorRequestStore() is not blocking for CeramicDaemon.create(...)
    expect(mockWasCalled).toBeFalsy()

    // resumeRunningStatesFromAnchorRequestStore() is triggered by CeramicDaemon.create(...)
    await TestUtils.delay(MOCK_WAS_CALLED_DELAY + 100)
    expect(mockWasCalled).toBeTruthy()
  }, 10000)

  it("Resume method isn't called when initialized with directly constructor", () => {
    expect(false).toBeTruthy()
  })
})
