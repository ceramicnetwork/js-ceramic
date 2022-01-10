import fetch from 'cross-fetch'
jest.mock('cross-fetch', () => jest.fn()) // this gets hoisted to the top of the file
const mockFetch = fetch as jest.Mock
const { Response } = jest.requireActual('cross-fetch')

import { createCeramic } from '../../create-ceramic'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { CeramicApi, IpfsApi } from '@ceramicnetwork/common'
import { clearDid, happyPath, wrongProof } from './caip-flows'
import { TezosAuthProvider, TezosProvider } from '@ceramicnetwork/blockchain-utils-linking'
import { InMemorySigner } from '@taquito/signer'

const privateKey = 'p2sk2obfVMEuPUnadAConLWk7Tf4Dt3n4svSgJwrgpamRqJXvaYcg1'

let provider: TezosProvider
let publicKey: string

let ceramic: CeramicApi
let ipfs: IpfsApi

beforeAll(async () => {
  ipfs = await createIPFS()
  ceramic = await createCeramic(ipfs)
  const signer = await InMemorySigner.fromSecretKey(privateKey)
  provider = {
    signer,
  }
  publicKey = await provider.signer.publicKey()
  mockFetch.mockReset()
  mockFetch.mockImplementation(async () => {
    return new Response(
      JSON.stringify({
        pubkey: publicKey,
      })
    )
  })
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
