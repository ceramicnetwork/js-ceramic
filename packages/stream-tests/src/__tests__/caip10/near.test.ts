import { createCeramic } from '../../create-ceramic.js'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { CeramicApi, IpfsApi } from '@ceramicnetwork/common'
import * as linking from '@ceramicnetwork/blockchain-utils-linking'
import { happyPath, wrongProof, clearDid } from './caip-flows.js'
import * as nearApiJs from 'near-api-js'

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
} as unknown as nearApiJs.ConnectConfig

let ceramic: CeramicApi
let ipfs: IpfsApi

beforeEach(async () => {
  ceramic = await createCeramic(ipfs)
}, 10000)

afterEach(async () => {
  await ceramic.close()
}, 10000)

beforeAll(async () => {
  ipfs = await createIPFS()
}, 10000)

afterAll(async () => {
  await ipfs?.stop()
}, 10000)

test('happy path', async () => {
  const near = await nearApiJs.connect(config)
  const authProvider = new linking.NearAuthProvider(near, accountName, chainRef)
  await happyPath(ceramic, authProvider)
}, 20000)

test('wrong proof', async () => {
  const near = await nearApiJs.connect(config)
  const authProvider = new linking.NearAuthProvider(near, accountName, chainRef)
  await wrongProof(ceramic, authProvider)
}, 20000)

test('clear Did', async () => {
  const near = await nearApiJs.connect(config)
  const authProvider = new linking.NearAuthProvider(near, accountName, chainRef)
  await clearDid(ceramic, authProvider)
}, 20000)
