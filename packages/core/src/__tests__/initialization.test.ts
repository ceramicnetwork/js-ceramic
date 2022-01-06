import { jest } from '@jest/globals'
import { Ceramic } from '../ceramic.js'
import tmp from 'tmp-promise'
import { IpfsApi } from '@ceramicnetwork/common'
import { createIPFS } from './ipfs-util.js'
import { InMemoryAnchorService } from '../anchor/memory/in-memory-anchor-service.js'
import { delay } from './delay.js'

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
    const ceramic = await Ceramic.create(ipfs1, { stateStoreDirectory })
    await delay(1000)
    const supportedChains = await ceramic.getSupportedChains()
    expect(supportedChains).toEqual(['inmemory:12345'])
    await ceramic.close()
  })

  it('can create Ceramic instance explicitly on inmemory network', async () => {
    const stateStoreDirectory = await tmp.tmpName()
    const ceramic = await Ceramic.create(ipfs1, {
      networkName: 'inmemory',
      stateStoreDirectory,
    })
    await delay(1000)
    const supportedChains = await ceramic.getSupportedChains()
    expect(supportedChains).toEqual(['inmemory:12345'])
    await ceramic.close()
  })

  it('cannot create Ceramic instance on network not supported by our anchor service', async () => {
    const [modules, params] = await Ceramic._processConfig(ipfs1, { networkName: 'local' })
    modules.anchorService = new InMemoryAnchorService({})
    const ceramic = new Ceramic(modules, params)
    await expect(ceramic._init(false)).rejects.toThrow(
      "No usable chainId for anchoring was found.  The ceramic network 'local' supports the chains: ['eip155:1337'], but the configured anchor service '<inmemory>' only supports the chains: ['inmemory:12345']"
    )
    await delay(1000)
  })

  it('cannot create Ceramic instance on invalid network', async () => {
    const stateStoreDirectory = await tmp.tmpName()
    await expect(
      Ceramic.create(ipfs1, {
        networkName: 'fakenetwork',
        stateStoreDirectory,
      })
    ).rejects.toThrow(
      "Unrecognized Ceramic network name: 'fakenetwork'. Supported networks are: 'mainnet', 'testnet-clay', 'dev-unstable', 'local', 'inmemory'"
    )
    await delay(1000)
  }, 10000)
})
