import { signTx, Tx, SignMeta, createWalletFromMnemonic, Wallet, StdTx } from '@tendermint/sig'
import { validateLink } from '../cosmos'
import * as linking from '@ceramicnetwork/blockchain-utils-linking'

const did = 'did:3:bafysdfwefwe'
const mnemonic = 'test salon husband push melody usage fine ensure blade deal miss twin'
const local_provider = createWalletFromMnemonic(mnemonic)
const chainRef = 'cosmoshub-3'

class CosmosMockSigner {
  readonly provider: Wallet

  constructor(local_provider: Wallet) {
    this.provider = local_provider
  }

  public async sign(msg: Tx, metadata: SignMeta): Promise<StdTx> {
    return new Promise((resolve): void => {
      const signature = signTx(msg, metadata, this.provider)
      resolve(signature)
    })
  }
}

describe('Blockchain: Cosmos', () => {
  describe('validateLink', () => {
    test('validate proof for cosmoshub3', async () => {
      const provider = new CosmosMockSigner(local_provider)
      const authProvider = new linking.cosmos.CosmosAuthProvider(
        provider,
        local_provider.address,
        chainRef
      )
      const proof = await authProvider.createLink(did)
      await expect(validateLink(proof)).resolves.toEqual(proof)
    })
  })
})
