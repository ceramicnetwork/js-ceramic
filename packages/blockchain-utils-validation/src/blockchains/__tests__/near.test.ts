import { KeyPair } from 'near-api-js'
import { validateLink } from '../near'
import * as linking from '@ceramicnetwork/blockchain-utils-linking'
import * as uint8arrays from 'uint8arrays'

const did = 'did:3:bafysdfwefwe'
const privateKey =
  'ed25519:9hB3onqC56qBSHpHJaE6EyxKPyFxCxzRBkmjuVx6UqXwygvAmFbwnsLuZ2YHsYJqkPTCygVBwXpNzssvWvUySbd'
const localProvider = KeyPair.fromString(privateKey)
const chainRef = 'testnet'
const address = 'crustykitty.testnet'

class NearMockSigner {
  readonly provider: KeyPair

  constructor(local_provider: KeyPair) {
    this.provider = local_provider
  }

  public async sign(message: string): Promise<{ signature: string; account: string }> {
    const { signature, publicKey } = await this.provider.sign(uint8arrays.fromString(message))
    return {
      signature: uint8arrays.toString(signature, 'base64pad'),
      account: uint8arrays.toString(publicKey.data, 'base64pad'),
    }
  }
}

describe('Blockchain: NEAR', () => {
  describe('validateLink', () => {
    test(`validate proof for ${chainRef}`, async () => {
      const provider = new NearMockSigner(localProvider)
    //  const address = uint8arrays.toString(localProvider.getPublicKey().data, 'base64pad')
      const authProvider = new linking.NearAuthProvider(provider, address, chainRef)
      const proof = await authProvider.createLink(did)
      await expect(validateLink(proof)).resolves.toEqual(proof)
    })
  })
})
