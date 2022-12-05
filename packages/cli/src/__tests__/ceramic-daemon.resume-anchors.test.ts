import { Repository } from '@ceramicnetwork/core'
import { jest } from '@jest/globals'
import { IpfsApi, Networks, TestUtils } from '@ceramicnetwork/common'
import { CeramicDaemon } from '../ceramic-daemon.js'
import { StateStoreMode } from '../daemon-config.js'
import tmp from 'tmp-promise'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import * as util from '../build-ipfs-connection.util.js'

const MOCK_WAS_CALLED_DELAY = 3 * 1000

describe('Ceramic Daemon Anchor Resuming', () => {
  // const origBuildIpfs = util.buildIpfsConnection
  let mockWasCalled: boolean
  let stateStoreDir: tmp.DirectoryResult

  beforeAll(async () => {
    // const mocked = jest.fn()
    // mocked.mockImplementation(async (): Promise<IpfsApi> => {
    //   return await createIPFS()
    // })
    // Object.defineProperty(util, 'buildIpfsConnection', {
    //   value: mocked
    // })
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
    await stateStoreDir.cleanup()
  })

  afterAll(() => {
    // Object.defineProperty(util, 'buildIpfsConnection', {
    //   value: origBuildIpfs
    // })
  })

  it('Resume method is called when initialized with create()', async () => {
    const daemon = await CeramicDaemon.create({
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
