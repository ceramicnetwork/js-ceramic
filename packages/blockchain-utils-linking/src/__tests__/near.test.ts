import { NearAuthProvider } from '../near'
import { KeyPair } from 'near-api-js'
import * as uint8arrays from 'uint8arrays'

const did = 'did:3:bafysdfwefwe'
const privateKey =
  'ed25519:9hB3onqC56qBSHpHJaE6EyxKPyFxCxzRBkmjuVx6UqXwygvAmFbwnsLuZ2YHsYJqkPTCygVBwXpNzssvWvUySbd'
const local_provider = KeyPair.fromString(privateKey)
const chainRef = 'testnet'
const account = 'crustykitty.testnet'

class NearMockSigner {
  readonly provider: KeyPair

  constructor(local_provider: KeyPair) {
    this.provider = local_provider
  }

  public async sign(message: string): Promise<{ signature: String; account: String }> {
    const { signature, publicKey } = await this.provider.sign(uint8arrays.fromString(message))
    return {
      signature: uint8arrays.toString(signature, 'base64pad'),
      account: uint8arrays.toString(publicKey.data, 'base64pad'),
    }
  }
}

beforeAll(() => {
  global.Date.now = jest.fn().mockImplementation(() => 666000)
})

afterAll(() => {
  jest.clearAllMocks()
})

describe('Blockchain: NEAR', () => {
  describe('createLink', () => {
    test(`create proof for ${chainRef}`, async () => {
      const nearAuthProvider = new NearAuthProvider(
        local_provider,
        account,
        chainRef
      )
      const proof = await nearAuthProvider.createLink(did)
      console.log('proof', proof)
      expect(proof).toMatchSnapshot()
    })
  })

  describe('authenticate', () => {
    test(`create proof for ${chainRef}`, async () => {
      const provider = new NearMockSigner(local_provider)
      const authProvider = new NearAuthProvider(
        provider,
        account,
        chainRef
      )
      const result = await authProvider.authenticate('msg')
      expect(result).toMatchSnapshot()
    })
  })

})
