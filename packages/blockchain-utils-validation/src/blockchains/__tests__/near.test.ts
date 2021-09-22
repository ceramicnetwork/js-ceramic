import { validateLink } from '../near'
import * as linking from '@ceramicnetwork/blockchain-utils-linking'
import * as nearApiJs from 'near-api-js'

const did = 'did:3:bafysdfwefwe'
const privateKey =
  'ed25519:9hB3onqC56qBSHpHJaE6EyxKPyFxCxzRBkmjuVx6UqXwygvAmFbwnsLuZ2YHsYJqkPTCygVBwXpNzssvWvUySbd'
const chainRef = 'testnet'
const accountName = 'crustykitty.testnet'
const keyPair = nearApiJs.utils.KeyPair.fromString(privateKey)
const keyStore = new nearApiJs.keyStores.InMemoryKeyStore()
keyStore.setKey(chainRef, accountName, keyPair)

const config = {
  keyStore, // instance of InMemoryKeyStore
  networkId: 'testnet',
  nodeUrl: 'fake-address.org',
  walletUrl: 'fake-address.org',
  helperUrl: 'fake-address.org',
  explorerUrl: 'fake-address.org',
}

describe('Blockchain: NEAR', () => {
  describe('validateLink', () => {
    test(`validate proof for ${chainRef}`, async () => {
      const near = await nearApiJs.connect(config)
      const authProvider = new linking.NearAuthProvider(near, accountName, chainRef)
      const proof = await authProvider.createLink(did)
      await expect(validateLink(proof)).resolves.toEqual(proof)
    })
  })
})
