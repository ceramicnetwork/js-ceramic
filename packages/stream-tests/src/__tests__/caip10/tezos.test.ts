import { jest } from '@jest/globals'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { CeramicApi, IpfsApi } from '@ceramicnetwork/common'
import { clearDid, happyPath, wrongProof } from './caip-flows.js'
import { TezosAuthProvider, TezosProvider } from '@ceramicnetwork/blockchain-utils-linking'
import { InMemorySigner } from '@taquito/signer'

const privateKey = 'p2sk2obfVMEuPUnadAConLWk7Tf4Dt3n4svSgJwrgpamRqJXvaYcg1'

let provider: TezosProvider
let publicKey: string

let ceramic: CeramicApi
let ipfs: IpfsApi

jest.unstable_mockModule('cross-fetch', () => {
  const originalModule = jest.requireActual('cross-fetch') as any
  const fakeFetch = async () => {
    return new originalModule.Response(JSON.stringify({ pubkey: publicKey }))
  }
  return {
    default: fakeFetch,
  }
})

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

test('happy path', async () => {
  const authProvider = new TezosAuthProvider(provider)
  await happyPath(ceramic, authProvider)
}, 120000)

test('wrong proof', async () => {
  const authProvider = new TezosAuthProvider(provider)
  await wrongProof(ceramic, authProvider)
}, 120000)

test('clear did', async () => {
  const authProvider = new TezosAuthProvider(provider)
  await clearDid(ceramic, authProvider)
}, 120000)
