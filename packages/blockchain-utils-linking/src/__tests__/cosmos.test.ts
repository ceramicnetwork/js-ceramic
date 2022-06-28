import { jest } from '@jest/globals'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import tendermint from '@tendermint/sig'
import { CosmosAuthProvider } from '../cosmos.js'

const did = 'did:3:bafysdfwefwe'
const mnemonic = 'test salon husband push melody usage fine ensure blade deal miss twin'
const local_provider = tendermint.createWalletFromMnemonic(mnemonic)
const chainRef = 'cosmoshub-3'

class CosmosMockSigner {
  readonly provider: tendermint.Wallet

  constructor(local_provider: tendermint.Wallet) {
    this.provider = local_provider
  }

  public async sign(msg: tendermint.Tx, metadata: tendermint.SignMeta): Promise<tendermint.StdTx> {
    return new Promise((resolve): void => {
      const signature = tendermint.signTx(msg, metadata, this.provider)
      resolve(signature)
    })
  }
}

beforeAll(() => {
  global.Date.now = jest.fn().mockImplementation(() => 666000)
})

afterAll(() => {
  jest.clearAllMocks()
})

describe('Blockchain: Cosmos', () => {
  describe('createLink', () => {
    test('create proof for cosmoshub3', async () => {
      const provider = new CosmosMockSigner(local_provider)
      const authProvider = new CosmosAuthProvider(provider, local_provider.address, chainRef)
      const proof = await authProvider.createLink(did)
      expect(proof).toMatchSnapshot()
    })
  })

  describe('authenticate', () => {
    test('create proof for cosmoshub3', async () => {
      const provider = new CosmosMockSigner(local_provider)
      const authProvider = new CosmosAuthProvider(provider, local_provider.address, chainRef)
      const result = await authProvider.authenticate('msg')
      expect(result).toMatchSnapshot()
    })
  })
})
