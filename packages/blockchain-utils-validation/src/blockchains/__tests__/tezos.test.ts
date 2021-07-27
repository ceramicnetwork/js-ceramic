import { TezosAuthProvider, TezosProvider } from '@ceramicnetwork/blockchain-utils-linking'
import { InMemorySigner } from '@taquito/signer'
import {
  WalletDelegateParams,
  WalletOriginateParams,
  WalletTransferParams,
  WalletProvider,
  TezosToolkit,
} from '@taquito/taquito'
import { validateLink } from '../tezos'
import mockFetch from 'jest-fetch-mock'
import { LinkProof } from '@ceramicnetwork/blockchain-utils-linking'

const did = 'did:3:bafysdfwefwe'
const privateKey = 'p2sk2obfVMEuPUnadAConLWk7Tf4Dt3n4svSgJwrgpamRqJXvaYcg1'
const chainRef = 'NetXdQprcVkpaWU' // Tezos mainnet

type HttpResponse = string

type IoTestCase = {
  testName?: string
  error?: any
  pubkeyObject?(publicKey: string): HttpResponse
}

type ProofTestCase = {
  message: string
  proof: () => LinkProof
}

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

let provider: TezosProvider
let publicKeyHash: string
let publicKey: string
let validProof: LinkProof
let invalidSignatureProof: LinkProof

// cache Date.now() to restore it after all tests
const dateNow = Date.now

beforeAll(async (done) => {
  // Mock Date.now() to return a constant value
  Date.now = () => 666000

  // initialize mock tezos provider
  const signer = await InMemorySigner.fromSecretKey(privateKey)
  provider = new TezosToolkit('https://mainnet-tezos.giganode.io')
  provider.setProvider({
    signer,
    wallet: new TezosMockWallet(signer),
  })

  // create proof for did
  publicKeyHash = await provider.signer.publicKeyHash()
  publicKey = await provider.signer.publicKey()
  const authProvider = new TezosAuthProvider(provider, chainRef)
  validProof = await authProvider.createLink(did)
  invalidSignatureProof = Object.assign({}, validProof)
  invalidSignatureProof.signature = 'invalid'
  done()
})

afterEach(() => {
  mockFetch.mockReset()
})

afterAll(() => {
  // restore Date.now()
  Date.now = dateNow
})

describe('Blockchain: Tezos', () => {
  describe('validateLink', () => {
    // create test cases
    const ioTestCases: IoTestCase[] = [
      // Validation not possible
      // - public key hash never used the blockchain
      // - public key can't be found from non-existant wallet (on the blockchain)
      // - signature can't be verified
      {
        testName: 'unable to validate when wallet address has never interacted with the blockchain',
        error: new Error('Axios 404 response status error'), // use axios 404 error
      },

      // Validation not possible
      // - public key is not published
      // - signature can not be verified
      {
        testName: 'unable to validate when wallet address has not been published to the blockchain',
        pubkeyObject(): HttpResponse {
          return JSON.stringify({
            data: {
              pubkey: undefined,
            },
          })
        },
      },

      // Able to test validation
      // - the public key is published/found on the blockchain
      // - the signature can be verified
      {
        pubkeyObject(publicKey?: string): HttpResponse {
          return JSON.stringify({
            data: {
              pubkey: publicKey,
            },
          })
        },
      },
    ]

    const proofTestCases: ProofTestCase[] = [
      // valid proof
      {
        message: 'valid proof',
        proof: () => validProof,
      },
      // invalid proof
      {
        message: 'invalid proof',
        proof: () => invalidSignatureProof,
      },
    ]

    // run test cases
    for (const { testName, pubkeyObject, error } of ioTestCases) {
      for (const { message, proof } of proofTestCases) {
        test(testName || message, async (done) => {
          // start test with the proof from the test case
          const testPromise = expect(validateLink(proof())).resolves.toMatchSnapshot()

          // mock axios response or error
          if (pubkeyObject) {
            mockFetch.mockResponse(pubkeyObject(publicKey))
          }
          if (error) {
            mockFetch.mockReject(error)
          }
          expect(mockFetch).toHaveBeenCalledWith(
            `https://api.tzstats.com/explorer/account/${publicKeyHash}`
          )

          // wait for the test to finish
          await testPromise
          done()
        })
      }
    }
  })
})
