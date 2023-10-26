import { jest } from '@jest/globals'
import { TezosAuthProvider, TezosProvider } from '@ceramicnetwork/blockchain-utils-linking'
import { InMemorySigner } from '@taquito/signer'
import { LinkProof } from '@ceramicnetwork/blockchain-utils-linking'
import { AccountId, ChainId } from 'caip'
import { normalizeAccountId } from '@ceramicnetwork/common'
import HttpRequestMock from 'http-request-mock'

const did = 'did:3:bafysdfwefwe'
const privateKey = 'p2sk2obfVMEuPUnadAConLWk7Tf4Dt3n4svSgJwrgpamRqJXvaYcg1'

type IoTestCase = {
  testName?: string
  error?: any
  returnsPubkey?: boolean
  pubkeyFound?: boolean
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
    returnsPubkey: true,
    pubkeyFound: false,
  },

  // Able to test validation
  // - the public key is published/found on the blockchain
  // - the signature can be verified
  {
    returnsPubkey: true,
    pubkeyFound: true,
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

// cache Date.now() to restore it after all tests
const dateNow = Date.now
const mocker = HttpRequestMock.setupForUnitTest('fetch')

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

  const accountId = normalizeAccountId(validProof.account)
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
    for (const { testName, returnsPubkey, pubkeyFound, error } of ioTestCases) {
      for (const { message, proof } of proofTestCases) {
        test(testName || message, async () => {
          const { validateLink } = await import('../../index.js')
          // mock axios response or error
          if (returnsPubkey) {
            mocker.mock({
              url: 'https://api.tzstats.com/explorer/account/',
              body: async () => {
                return { pubkey: pubkeyFound ? publicKey : undefined }
              },
              times: 1,
            })
          }
          if (error) {
            mocker.mock({
              url: 'https://api.tzstats.com/explorer/account/',
              status: 400,
              body: error,
              times: 1,
            })
          }
          // wait for test with the proof from the test case
          await expect(validateLink(proof())).resolves.toMatchSnapshot()
        })
      }
    }
  })
})
