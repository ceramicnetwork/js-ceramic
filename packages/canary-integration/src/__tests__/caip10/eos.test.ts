import { EOSIOProvider } from '@smontero/eosio-local-provider'
import * as linking from '@ceramicnetwork/blockchain-utils-linking'
import { createIPFS } from '../../create-ipfs'
import { IpfsApi, CeramicApi } from '@ceramicnetwork/common'
import { createCeramic } from '../../create-ceramic'
import { Caip10Link } from '@ceramicnetwork/stream-caip10-link'

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
  const authProvider = new linking.eosio.EosioAuthProvider(
    telosTestnetProvider,
    telosTestnetAccount
  )
  const accountId = await authProvider.accountId()
  const caip = await Caip10Link.fromAccount(ceramic, accountId)
  await caip.setDid(ceramic.did, authProvider)
  expect(caip.state.log.length).toEqual(2)
  expect(caip.did).toEqual(ceramic.did.id)
}, 10000)
test('wrong proof', async () => {
  const authProvider = new linking.eosio.EosioAuthProvider(
    telosTestnetProvider,
    telosTestnetAccount
  )
  const accountId = await authProvider.accountId()
  accountId.address = 'wrong-test-user'
  const caip = await Caip10Link.fromAccount(ceramic, accountId)
  await expect(caip.setDid(ceramic.did, authProvider)).rejects.toThrow(
    /Address doesn't match stream controller/
  )
}, 10000)
