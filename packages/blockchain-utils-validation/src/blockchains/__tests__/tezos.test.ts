import { TezosAuthProvider, TezosProvider } from '@ceramicnetwork/blockchain-utils-linking'
import { InMemorySigner } from '@taquito/signer'
import { validateLink } from '../../index'
import { LinkProof } from '@ceramicnetwork/blockchain-utils-linking'
import fetch from 'cross-fetch'
import { AccountID, ChainID } from 'caip'
jest.mock('cross-fetch', () => jest.fn()) // this gets hoisted to the top of the file
const mockFetch = fetch as jest.Mock
const { Response } = jest.requireActual('cross-fetch')

const did = 'did:3:bafysdfwefwe'
const privateKey = 'p2sk2obfVMEuPUnadAConLWk7Tf4Dt3n4svSgJwrgpamRqJXvaYcg1'

type HttpResponse = Response

type IoTestCase = {
  testName?: string
  error?: any
  pubkeyObject?(publicKey: string): HttpResponse
}

type ProofTestCase = {
  message: string
  proof: () => LinkProof
}

let provider: TezosProvider
let publicKeyHash: string
let publicKey: string
let validProof: LinkProof
let invalidSignatureProof: LinkProof
let invalidChainIdProof: LinkProof

// cache Date.now() to restore it after all tests
const dateNow = Date.now

beforeAll(async () => {
  // Mock Date.now() to return a constant value
  Date.now = () => 666000

  // initialize mock tezos provider
  const signer = await InMemorySigner.fromSecretKey(privateKey)
  provider = {
    signer,
  }

  // create proof for did
  publicKeyHash = await provider.signer.publicKeyHash()
  publicKey = await provider.signer.publicKey()
  const authProvider = new TezosAuthProvider(provider)
  validProof = await authProvider.createLink(did)

  invalidSignatureProof = Object.assign({}, validProof)
  invalidSignatureProof.signature = 'invalid'

  invalidChainIdProof = Object.assign({}, validProof)
  const accountId = AccountID.parse(invalidChainIdProof.account)
  const chainId = new ChainID(accountId.chainId)
  invalidChainIdProof.account = new AccountID({
    address: accountId.address,
    chainId: {
      namespace: chainId.namespace,
      reference: 'some unsupported chain reference',
    }
  }).toString()
})


afterAll(() => {
  // restore Date.now()
  Date.now = dateNow
  jest.clearAllMocks()
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
        error: new Error('Fetch response error'),
      },

      // Validation not possible
      // - public key is not published
      // - signature can not be verified
      {
        testName: 'unable to validate when wallet address has not been published to the blockchain',
        pubkeyObject(): HttpResponse {
          return new Response(JSON.stringify({
            pubkey: undefined,
          }))
        },
      },

      // Able to test validation
      // - the public key is published/found on the blockchain
      // - the signature can be verified
      {
        pubkeyObject(publicKey?: string): HttpResponse {
          return new Response(JSON.stringify({
            pubkey: publicKey,
          }))
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
      }
    ]

    // run test cases
    for (const { testName, pubkeyObject, error } of ioTestCases) {
      for (const { message, proof } of proofTestCases) {
        test(testName || message, async () => {
          void testName
          void message
          mockFetch.mockReset()
          // mock axios response or error
          if (pubkeyObject) {
            mockFetch.mockImplementationOnce(() => Promise.resolve(pubkeyObject(publicKey)))
          }
          if (error) {
            mockFetch.mockImplementationOnce(() => Promise.reject(error))
          }

          // wait for test with the proof from the test case
          await expect(validateLink(proof())).resolves.toMatchSnapshot()
        })
      }
    }
  })
})
