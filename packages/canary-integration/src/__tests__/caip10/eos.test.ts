import { EOSIOProvider } from '@smontero/eosio-local-provider'
import * as linking from '@ceramicnetwork/blockchain-utils-linking'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { IpfsApi, CeramicApi } from '@ceramicnetwork/common'
import { createCeramic } from '../../create-ceramic'
import { clearDid, happyPath, wrongProof } from './caip-flows'

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

beforeAll(async () => {
  ipfs = await createIPFS()
  ceramic = await createCeramic(ipfs)
}, 120000)

afterAll(async () => {
  await ceramic.close()
  await ipfs?.stop()
}, 120000)

test('happy path', async () => {
  const authProvider = new linking.eosio.EosioAuthProvider(
    telosTestnetProvider,
    telosTestnetAccount
  )
  await happyPath(ceramic, authProvider)
}, 120000)

test('wrong proof', async () => {
  const authProvider = new linking.eosio.EosioAuthProvider(
    telosTestnetProvider,
    telosTestnetAccount
  )
  await wrongProof(ceramic, authProvider)
}, 120000)

test('clear did', async () => {
  const authProvider = new linking.eosio.EosioAuthProvider(
    telosTestnetProvider,
    telosTestnetAccount
  )
  await clearDid(ceramic, authProvider)
}, 120000)
