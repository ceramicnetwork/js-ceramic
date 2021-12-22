import { NearAuthProvider } from '../near.js'
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
      const near = await nearApiJs.connect(config)
      const nearAuthProvider = new NearAuthProvider(near, accountName, chainRef)
      const proof = await nearAuthProvider.createLink(did)
      expect(proof).toMatchSnapshot()
    })
  })

  describe('authenticate', () => {
    test(`create proof for ${chainRef}`, async () => {
      const near = await nearApiJs.connect(config)
      const authProvider = new NearAuthProvider(near, accountName, chainRef)
      const result = await authProvider.authenticate('msg')
      expect(result).toMatchSnapshot()
    })
  })
})
