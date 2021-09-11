import { TezosAuthProvider, TezosProvider } from '../tezos'
import { InMemorySigner } from '@taquito/signer'

const did = 'did:3:bafysdfwefwe'
const privateKey = 'p2sk2obfVMEuPUnadAConLWk7Tf4Dt3n4svSgJwrgpamRqJXvaYcg1'
const chainRef = 'NetXdQprcVkpaWU' // Tezos mainnet
let provider: TezosProvider

// cache Date.now() to restore it after all tests
const dateNow = Date.now

beforeAll(async (done) => {
  // Mock Date.now() to return a constant value
  Date.now = () => 666000

  const signer = await InMemorySigner.fromSecretKey(privateKey)
  provider = {
    signer,
  }
  done()
})

afterAll(() => {
  // restore Date.now()
  Date.now = dateNow
})

describe('Blockchain: Tezos', () => {
  describe('createLink', () => {
    test(`create proof for ${chainRef}`, async () => {
      const authProvider = new TezosAuthProvider(provider)
      const proof = await authProvider.createLink(did)
      expect(proof).toMatchSnapshot()
    })
  })

  describe('authenticate', () => {
    test(`create proof for ${chainRef}`, async () => {
      const authProvider = new TezosAuthProvider(provider)
      const result = await authProvider.authenticate('msg')
      expect(result.length).toBe(2 + 2 * 32) // 2 for "0x" prefix, 2 * 32 for 32 bytes of entropy as a hex string
      expect(result).toMatchSnapshot()
    })
  })

  describe('authenticate', () => {
    test(`entropy replication for ${chainRef}`, async () => {
      const authProvider = new TezosAuthProvider(provider)
      const msg = 'hello'
      const result1 = await authProvider.authenticate(msg)
      const result2 = await authProvider.authenticate(msg)
      expect(result1).toMatchSnapshot()
      expect(result2).toMatchSnapshot()
    })
  })
})
