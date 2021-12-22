import { signTx, Tx, SignMeta, createWalletFromMnemonic, Wallet, StdTx } from '@tendermint/sig'
import { validateLink } from '../cosmos.js'
import * as linking from '@ceramicnetwork/blockchain-utils-linking'

const did = 'did:3:bafysdfwefwe'
const mnemonic = 'test salon husband push melody usage fine ensure blade deal miss twin'
const localProvider = createWalletFromMnemonic(mnemonic)
const chainRef = 'cosmoshub-3'

class CosmosMockSigner {
  constructor(readonly provider: Wallet) {}

  public async sign(msg: Tx, metadata: SignMeta): Promise<StdTx> {
    return signTx(msg, metadata, this.provider)
  }
}

describe('Blockchain: Cosmos', () => {
  describe('validateLink', () => {
    test('validate proof for cosmoshub3', async () => {
      const provider = new CosmosMockSigner(localProvider)
      const authProvider = new linking.cosmos.CosmosAuthProvider(
        provider,
        localProvider.address,
        chainRef
      )
      const proof = await authProvider.createLink(did)
      await expect(validateLink(proof)).resolves.toEqual(proof)
    })
  })
})
