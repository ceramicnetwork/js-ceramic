import { jest } from '@jest/globals'
import { Ceramic } from '../ceramic.js'
import tmp from 'tmp-promise'
import type { IpfsApi } from '@ceramicnetwork/common'
import { TestUtils } from '@ceramicnetwork/common'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { InMemoryAnchorService } from '../anchor/memory/in-memory-anchor-service.js'

describe('Ceramic integration', () => {
  jest.setTimeout(60000)
  let ipfs1: IpfsApi

  beforeEach(async () => {
    ipfs1 = await createIPFS()
  })

  afterEach(async () => {
    await ipfs1.stop()
  })

  it('can create Ceramic instance on default network', async () => {
    const stateStoreDirectory = await tmp.tmpName()
    const databaseConnectionString = new URL(`sqlite://${stateStoreDirectory}/ceramic.sqlite`)
    const ceramic = await Ceramic.create(ipfs1, {
      stateStoreDirectory,
      indexing: { db: databaseConnectionString.href, models: [] },
    })
    await TestUtils.delay(1000)
    const supportedChains = await ceramic.getSupportedChains()
    expect(supportedChains).toEqual(['inmemory:12345'])
    await ceramic.close()
  })

  it('can create Ceramic instance explicitly on inmemory network', async () => {
    const stateStoreDirectory = await tmp.tmpName()
    const databaseConnectionString = new URL(`sqlite://${stateStoreDirectory}/ceramic.sqlite`)
    const ceramic = await Ceramic.create(ipfs1, {
      networkName: 'inmemory',
      stateStoreDirectory,
      indexing: { db: databaseConnectionString.href, models: [] },
    })
    await TestUtils.delay(1000)
    const supportedChains = await ceramic.getSupportedChains()
    expect(supportedChains).toEqual(['inmemory:12345'])
    await ceramic.close()
  })

  it('cannot create Ceramic instance on network not supported by our anchor service', async () => {
    const tmpDirectory = await tmp.tmpName()
    const databaseConnectionString = new URL(`sqlite://${tmpDirectory}/ceramic.sqlite`)
    const [modules, params] = await Ceramic._processConfig(ipfs1, {
      networkName: 'local',
      indexing: { db: databaseConnectionString.href, models: [] },
    })
    modules.anchorService = new InMemoryAnchorService({})
    const ceramic = new Ceramic(modules, params)
    await expect(ceramic._init(false)).rejects.toThrow(
      "No usable chainId for anchoring was found.  The ceramic network 'local' supports the chains: ['eip155:1337'], but the configured anchor service '<inmemory>' only supports the chains: ['inmemory:12345']"
    )
    await TestUtils.delay(1000)
  })

  it('cannot create Ceramic instance on invalid network', async () => {
    const stateStoreDirectory = await tmp.tmpName()
    const databaseConnectionString = new URL(`sqlite://${stateStoreDirectory}/ceramic.sqlite`)
    await expect(
      Ceramic.create(ipfs1, {
        networkName: 'fakenetwork',
        stateStoreDirectory,
        indexing: { db: databaseConnectionString.href, models: [] },
      })
    ).rejects.toThrow(
      "Unrecognized Ceramic network name: 'fakenetwork'. Supported networks are: 'mainnet', 'testnet-clay', 'dev-unstable', 'local', 'inmemory'"
    )
    await TestUtils.delay(1000)
  }, 10000)
})
