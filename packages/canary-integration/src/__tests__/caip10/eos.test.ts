import { EOSIOProvider } from '@smontero/eosio-local-provider'
import * as linking from '@ceramicnetwork/blockchain-utils-linking'
import { createIPFS } from '../../create-ipfs'
import { IpfsApi, CeramicApi } from '@ceramicnetwork/common'
import { createCeramic } from '../../create-ceramic'
import { happyPath, wrongProof } from './caip-flows'

const telosTestnetChainId = '1eaa0824707c8c16bd25145493bf062aecddfeb56c736f6ba6397f3195f33c9f'
const telosTestnetAccount = 'testuser1111'
const telosTestnetProvider = new EOSIOProvider({
  chainId: telosTestnetChainId,
  account: telosTestnetAccount,
  keys: {
    EOS6uUc8fYoCdyz7TUAXqHvRbU7QnVirFuvcAW6NMQqBabdME6FnL:
      '5KFFFvKioakMpt8zWnyGKnLaDzzUSqy5V33PHHoxEam47pLJmo2',
  },
})

let ceramic: CeramicApi
let ipfs: IpfsApi

beforeEach(async () => {
  ceramic = await createCeramic(ipfs)
}, 20000)

afterEach(async () => {
  await ceramic.close()
}, 20000)

beforeAll(async () => {
  ipfs = await createIPFS()
}, 20000)

afterAll(async () => {
  await ipfs?.stop()
}, 20000)

test('happy path', async () => {
  const authProvider = new linking.eosio.EosioAuthProvider(
    telosTestnetProvider,
    telosTestnetAccount
  )
  await happyPath(ceramic, authProvider)
}, 20000)

test('wrong proof', async () => {
  const authProvider = new linking.eosio.EosioAuthProvider(
    telosTestnetProvider,
    telosTestnetAccount
  )
  await wrongProof(ceramic, authProvider)
}, 20000)
