// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import tendermint from '@tendermint/sig'
import { validateLink } from '../cosmos.js'
import * as linking from '@ceramicnetwork/blockchain-utils-linking'

const did = 'did:3:bafysdfwefwe'
const mnemonic = 'test salon husband push melody usage fine ensure blade deal miss twin'
const localProvider = tendermint.createWalletFromMnemonic(mnemonic)
const chainRef = 'cosmoshub-3'

class CosmosMockSigner {
  constructor(readonly provider: tendermint.Wallet) {}

  public async sign(msg: tendermint.Tx, metadata: tendermint.SignMeta): Promise<tendermint.StdTx> {
    return tendermint.signTx(msg, metadata, this.provider)
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
