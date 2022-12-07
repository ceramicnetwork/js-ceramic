import { Ceramic, AnchorResumingService } from '@ceramicnetwork/core'
import { jest } from '@jest/globals'
import { IpfsApi, Networks, TestUtils } from '@ceramicnetwork/common'
import { CeramicDaemon, makeCeramicConfig } from '../ceramic-daemon.js'
import { DaemonConfig, StateStoreMode } from '../daemon-config.js'
import tmp from 'tmp-promise'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { IpfsConnectionFactory } from '../ipfs-connection-factory.js'

const MOCK_WAS_CALLED_DELAY = 3 * 1000

function daemonConfigWithPath(path: string): DaemonConfig {
  return {
    network: {
      name: Networks.INMEMORY,
    },
    anchor: {},
    httpApi: {},
    ipfs: {},
    logger: {},
    metrics: {},
    node: {},
    stateStore: {
      mode: StateStoreMode.FS,
      localDirectory: path,
    },
  }
}

describe('Ceramic Daemon Anchor Resuming', () => {
  jest.setTimeout(10000)

  const origBuildIpfs = IpfsConnectionFactory.buildIpfsConnection
  let mockWasCalled: boolean
  let mockCompleted: boolean
  let stateStoreDir: tmp.DirectoryResult

  beforeAll(async () => {
    const mocked = jest.fn()
    mocked.mockImplementation(async (): Promise<IpfsApi> => {
      return await createIPFS()
    })
    ;(IpfsConnectionFactory as any).buildIpfsConnection = mocked
  })

  beforeEach(async () => {
    stateStoreDir = await tmp.dir({ unsafeCleanup: true })
    mockWasCalled = false
    mockCompleted = false

    jest
      .spyOn(AnchorResumingService.prototype, 'resumeRunningStatesFromAnchorRequestStore')
      .mockImplementation(() => {
        mockWasCalled = true
        return new Promise<void>(() => {
          setTimeout(() => {
            mockCompleted = true
          }, MOCK_WAS_CALLED_DELAY)
        })
      })
  })

  afterEach(async () => {
    await stateStoreDir.cleanup()
    stateStoreDir = undefined
  })

  afterAll(() => {
    ;(IpfsConnectionFactory as any).buildIpfsConnection = origBuildIpfs
  })

  it('Resume method is called when initialized with create()', async () => {
    const daemon = await CeramicDaemon.create(daemonConfigWithPath(stateStoreDir.path))
    expect(daemon).not.toBeNull()
    // resumeRunningStatesFromAnchorRequestStore() is not blocking for CeramicDaemon.create(...)
    expect(mockWasCalled).toBeTruthy()
    expect(mockCompleted).toBeFalsy()

    // resumeRunningStatesFromAnchorRequestStore() is triggered by CeramicDaemon.create(...)
    await TestUtils.delay(MOCK_WAS_CALLED_DELAY + 100) // TODO(CDB-2090): use less brittle approach to waiting for this condition
    expect(mockCompleted).toBeTruthy()
    await daemon.close()
  })

  it("Resume method isn't called when initialized with directly constructor", async () => {
    const daemonConfig = daemonConfigWithPath(stateStoreDir.path)
    const ceramicConfig = makeCeramicConfig(daemonConfig)
    const ipfs = await createIPFS()
    const core = await Ceramic.create(ipfs, ceramicConfig)
    const daemon = new CeramicDaemon(core, daemonConfig)
    await daemon.listen()
    expect(daemon).not.toBeNull()
    // resumeRunningStatesFromAnchorRequestStore() is not triggered by new CeramicDaemon(...)
    expect(mockWasCalled).toBeFalsy()
    expect(mockCompleted).toBeFalsy()

    // .. just checking again after delay to make sure
    await TestUtils.delay(MOCK_WAS_CALLED_DELAY + 3000) // TODO(CDB-2090): use less brittle approach to waiting for this condition
    expect(mockWasCalled).toBeFalsy()
    expect(mockCompleted).toBeFalsy()

    await daemon.close()
  })
})
