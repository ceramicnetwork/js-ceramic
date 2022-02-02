import { jest } from '@jest/globals'
import { TezosAuthProvider, TezosProvider } from '@ceramicnetwork/blockchain-utils-linking'
import { InMemorySigner } from '@taquito/signer'
import { LinkProof } from '@ceramicnetwork/blockchain-utils-linking'
import { AccountId, ChainId } from 'caip'

const did = 'did:3:bafysdfwefwe'
const privateKey = 'p2sk2obfVMEuPUnadAConLWk7Tf4Dt3n4svSgJwrgpamRqJXvaYcg1'

type HttpResponse = Response

type IoTestCase = {
  testName?: string
  error?: any
  pubkeyObject?(publicKey: string): Promise<HttpResponse>
}

type ProofTestCase = {
  message: string
  proof: () => LinkProof
}

const ioTestCases: IoTestCase[] = [
  // Validation not possible
  // - public key hash never used the blockchain
  // - public key can't be found from non-existant wallet (on the blockchain)
  // - signature can't be verified
  {
    testName: 'unable to validate when wallet address has never interacted with the blockchain',
    error: new Error('Fetch response erroraa'),
  },

  // Validation not possible
  // - public key is not published
  // - signature can not be verified
  {
    testName: 'unable to validate when wallet address has not been published to the blockchain',
    async pubkeyObject(): Promise<HttpResponse> {
      const { Response } = await import('cross-fetch')
      return new Response(
        JSON.stringify({
          pubkey: undefined,
        })
      )
    },
  },

  // Able to test validation
  // - the public key is published/found on the blockchain
  // - the signature can be verified
  {
    async pubkeyObject(publicKey?: string): Promise<HttpResponse> {
      const { Response } = await import('cross-fetch')
      return new Response(
        JSON.stringify({
          pubkey: publicKey,
        })
      )
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
  // invalid chain reference
  {
    message: 'invalid chain reference',
    proof: () => invalidChainIdProof,
  },
]

let provider: TezosProvider
let publicKey: string
let validProof: LinkProof
let invalidSignatureProof: LinkProof
let invalidChainIdProof: LinkProof
let responseResult: () => Promise<any>

// cache Date.now() to restore it after all tests
const dateNow = Date.now

jest.unstable_mockModule('cross-fetch', () => {
  const originalModule = jest.requireActual('cross-fetch') as any
  return {
    ...originalModule,
    default: () => responseResult(),
  }
})

beforeAll(async () => {
  // Mock Date.now() to return a constant value
  Date.now = () => 666000

  // initialize mock tezos provider
  const signer = await InMemorySigner.fromSecretKey(privateKey)
  provider = {
    signer,
  }

  // create proof for did
  publicKey = await provider.signer.publicKey()
  const authProvider = new TezosAuthProvider(provider)
  validProof = await authProvider.createLink(did)

  invalidSignatureProof = { ...validProof, signature: 'invalid' }

  const accountId = AccountId.parse(validProof.account)
  const chainId = new ChainId(accountId.chainId)
  const invalidAccount = new AccountId({
    address: accountId.address,
    chainId: {
      namespace: chainId.namespace,
      reference: 'some unsupported chain reference',
    },
  })
  invalidChainIdProof = { ...validProof, account: invalidAccount.toString() }
})

afterAll(() => {
  // restore Date.now()
  Date.now = dateNow
  jest.clearAllMocks()
})

describe('Blockchain: Tezos', () => {
  describe('validateLink', () => {
    // create test cases
    // run test cases
    for (const { testName, pubkeyObject, error } of ioTestCases) {
      for (const { message, proof } of proofTestCases) {
        test(testName || message, async () => {
          const { validateLink } = await import('../../index.js')
          // mock axios response or error
          if (pubkeyObject) {
            responseResult = async () => pubkeyObject(publicKey)
          }
          if (error) {
            responseResult = async () => Promise.reject(error)
          }
          // wait for test with the proof from the test case
          await expect(validateLink(proof())).resolves.toMatchSnapshot()
        })
      }
    }
  })
})
