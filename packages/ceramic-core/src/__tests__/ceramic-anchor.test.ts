import Ceramic from '../ceramic'
import IdentityWallet from 'identity-wallet'
import tmp from 'tmp-promise'
import Ipfs from 'ipfs'

import dagJose from 'dag-jose'
import basicsImport from 'multiformats/cjs/src/basics-import.js'
import legacy from 'multiformats/cjs/src/legacy.js'

jest.mock('../store/level-state-store')
jest.mock('../anchor/ethereum/ethereum-anchor-service')

const seed = '0x5872d6e0ae7347b72c9216db218ebbb9d9d0ae7ab818ead3557e8e78bf944184'

/**
 * Create an IPFS instance
 * @param overrideConfig - IFPS config for override
 */
const createIPFS =(overrideConfig: object = {}): Promise<any> => {
  basicsImport.multicodec.add(dagJose)
  const format = legacy(basicsImport, dagJose.name)

  const config = {
    ipld: { formats: [format] },
  }

  Object.assign(config, overrideConfig)
  return Ipfs.create(config)
}

describe('Ceramic anchoring', () => {
  jest.setTimeout(60000)
  let ipfs: Ipfs;
  let tmpFolder: any;

  const DOCTYPE_TILE = 'tile'

  const topic = '/ceramic_anchor'

  beforeAll(async () => {
    tmpFolder = await tmp.dir({ unsafeCleanup: true })

    ipfs = await createIPFS({
      repo: `${tmpFolder.path}`,
      config: {
        Addresses: { Swarm: [ `/ip4/127.0.0.1/tcp/${3001}` ] },
        Bootstrap: []
      }
    })
  })

  afterAll(async () => {
    await ipfs.stop(() => console.log('IPFS stopped'))
    await tmpFolder.cleanup()
  })

  it('can create multiple changes', async () => {
    const ceramic = await Ceramic.create(ipfs, {
      stateStorePath: await tmp.tmpName(),
      topic,
      anchorDelay: 2000,
    })

    await IdentityWallet.create({
      getPermission: async (): Promise<Array<string>> => [],
      seed,
      ceramic,
      disableIDX: true,
    })

    const owner = ceramic.context.did.id

    const doctype = await ceramic.createDocument(DOCTYPE_TILE, { content: { test: 123 } }, { applyOnly: false })
    await doctype.change({ content: { test: 'abcde' }, metadata: { owners: [owner] } }, { applyOnly: false })
    await doctype.change({ content: { test1: 'fghj' }, metadata: { owners: [owner] } }, { applyOnly: false })

    const updatePromise = new Promise(resolve => {
      doctype.on('change', () => {
        resolve()
      })
    })

    await updatePromise

    expect(doctype.content).toEqual({"test1": "fghj"})
    expect(doctype.state.log.length).toEqual(4)

    await ceramic.close()
  })
})
