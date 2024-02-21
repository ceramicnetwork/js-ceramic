import { jest } from '@jest/globals'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { CeramicApi, IpfsApi } from '@ceramicnetwork/common'
import { clearDid, happyPath, wrongProof } from './caip-flows.js'
import { TezosAuthProvider, TezosProvider } from '@ceramicnetwork/blockchain-utils-linking'
import { InMemorySigner } from '@taquito/signer'
import HttpRequestMock from 'http-request-mock'
import { testIfV3 } from '@ceramicnetwork/common-test-utils'

const privateKey = 'p2sk2obfVMEuPUnadAConLWk7Tf4Dt3n4svSgJwrgpamRqJXvaYcg1'

let provider: TezosProvider
let publicKey: string

let ceramic: CeramicApi
let ipfs: IpfsApi

const mocker = HttpRequestMock.setupForUnitTest('fetch')
mocker.mock({
  url: 'https://api.tzstats.com/explorer/account/',
  body: async () => {
    return { pubkey: publicKey }
  },
})

// These tests are never expected to be run in V' mode as caip10 will not be supported
beforeAll(async () => {
  const signer = await InMemorySigner.fromSecretKey(privateKey)
  provider = {
    signer,
  }
  publicKey = await provider.signer.publicKey()
  ipfs = await createIPFS()
  const { createCeramic } = await import('../../create-ceramic.js')
  ceramic = await createCeramic(ipfs)
}, 120000)

afterAll(async () => {
  await ceramic.close()
  await ipfs?.stop()
  jest.clearAllMocks()
}, 120000)

testIfV3(
  'happy path',
  async () => {
    const authProvider = new TezosAuthProvider(provider)
    await happyPath(ceramic, authProvider)
  },
  120000
)

testIfV3(
  'wrong proof',
  async () => {
    const authProvider = new TezosAuthProvider(provider)
    await wrongProof(ceramic, authProvider)
  },
  120000
)

testIfV3(
  'clear did',
  async () => {
    const authProvider = new TezosAuthProvider(provider)
    await clearDid(ceramic, authProvider)
  },
  120000
)
