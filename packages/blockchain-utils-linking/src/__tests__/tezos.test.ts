import { char2Bytes, TezosAuthProvider, TezosProvider } from '../tezos'
import { InMemorySigner } from '@taquito/signer'
import {
  WalletDelegateParams,
  WalletOriginateParams,
  WalletTransferParams,
  WalletProvider,
  TezosToolkit,
} from '@taquito/taquito'
import utils from '@taquito/utils'

const did = 'did:3:bafysdfwefwe'
const privateKey = 'p2sk2obfVMEuPUnadAConLWk7Tf4Dt3n4svSgJwrgpamRqJXvaYcg1'
const chainRef = 'NetXdQprcVkpaWU' // Tezos mainnet
let provider: TezosProvider

// Mock Taquito's WalletProvider
class TezosMockWallet implements WalletProvider {
  constructor(private readonly signer: InMemorySigner) {}
  async getPKH(): Promise<string> {
    return this.signer.publicKeyHash()
  }

  async mapTransferParamsToWalletParams(_params: WalletTransferParams) {
    throw new Error('Should not be called')
  }

  async mapOriginateParamsToWalletParams(_params: WalletOriginateParams) {
    throw new Error('Should not be called')
  }

  async mapDelegateParamsToWalletParams(_params: WalletDelegateParams) {
    throw new Error('Should not be called')
  }

  async sendOperations(_params: any[]): Promise<string> {
    throw new Error('Should not be called')
  }
}

// cache Date.now() to restore it after all tests
const dateNow = Date.now

beforeAll(async (done) => {
  // Mock Date.now() to return a constant value
  Date.now = () => 666000

  const signer = await InMemorySigner.fromSecretKey(privateKey)
  provider = new TezosToolkit('https://mainnet-tezos.giganode.io')
  provider.setProvider({
    signer,
    wallet: new TezosMockWallet(signer),
  })
  done()
})

afterAll(() => {
  // restore Date.now()
  Date.now = dateNow
})

describe('Blockchain: Tezos', () => {
  describe('createLink', () => {
    test(`create proof for ${chainRef}`, async () => {
      const authProvider = new TezosAuthProvider(provider, chainRef)
      const proof = await authProvider.createLink(did)
      expect(proof).toMatchSnapshot()
    })
  })

  describe('authenticate', () => {
    test(`create proof for ${chainRef}`, async () => {
      const authProvider = new TezosAuthProvider(provider, chainRef)
      const result = await authProvider.authenticate('msg')
      expect(result.length).toBe(2 + 2 * 32) // 2 for "0x" prefix, 2 * 32 for 32 bytes of entropy as a hex string
      expect(result).toMatchSnapshot()
    })
  })

  describe('authenticate', () => {
    test(`entropy replication for ${chainRef}`, async () => {
      const authProvider = new TezosAuthProvider(provider, chainRef)
      const msg = 'hello'
      const result1 = await authProvider.authenticate(msg)
      const result2 = await authProvider.authenticate(msg)
      expect(result1).toMatchSnapshot()
      expect(result2).toMatchSnapshot()
    })
  })

  describe('char2Bytes', () => {
    test('should match the @taquito/utils char2Bytes() implementation', () => {
      // get a random string of length 32
      const s = 'some random string. this should be fine.'
      expect(char2Bytes(s)).toBe(utils.char2Bytes(s))
    })
  })
})
