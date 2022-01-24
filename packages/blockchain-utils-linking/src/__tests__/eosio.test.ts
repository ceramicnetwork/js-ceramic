import { jest } from '@jest/globals'
import { EOSIOProvider } from '@smontero/eosio-local-provider'
import { EosioAuthProvider } from '../eosio.js'

const did = 'did:3:bafysdfwefwe'
const telosTestnetChainId = '1eaa0824707c8c16bd25145493bf062aecddfeb56c736f6ba6397f3195f33c9f'
const jungleChainId = '2a02a0053e5a8cf73a56ba0fda11e4d92e0238a4a2aa74fccf46d5a910746840'
const telosTestnetAccount = 'testuser1111'
const jungleAccount = 'idx3idctest1'
const telosTestnetProvider = new EOSIOProvider({
  chainId: telosTestnetChainId,
  account: telosTestnetAccount,
  keys: {
    EOS6uUc8fYoCdyz7TUAXqHvRbU7QnVirFuvcAW6NMQqBabdME6FnL:
      '5KFFFvKioakMpt8zWnyGKnLaDzzUSqy5V33PHHoxEam47pLJmo2',
  },
})
const jungleProvider = new EOSIOProvider({
  chainId: jungleChainId,
  account: jungleAccount,
  keys: {
    EOS7f7hdusWKXY1cymDLvUL3m6rTLKmdyPi4e6kquSnmfVxxEwVcC:
      '5JRzDcbMqvTJxjHeP8vZqZbU9PwvaaTsoQhoVTAs3xBVSZaPB9U',
  },
})

beforeAll(() => {
  global.Date.now = jest.fn().mockImplementation(() => 666000)
})

afterAll(() => {
  jest.clearAllMocks()
})

test('accountId', async () => {
  const authProvider = new EosioAuthProvider(telosTestnetProvider, telosTestnetAccount)
  await expect(authProvider.accountId()).resolves.toMatchSnapshot()
})

describe('createLink', () => {
  test('generate proof on telos testnet', async () => {
    const authProvider = new EosioAuthProvider(telosTestnetProvider, telosTestnetAccount)
    await expect(authProvider.createLink(did)).resolves.toMatchSnapshot()
  })

  test('generate proof on jungle testnet', async () => {
    const authProvider = new EosioAuthProvider(jungleProvider, jungleAccount)
    await expect(authProvider.createLink(did)).resolves.toMatchSnapshot()
  })

  test('fail on telos testnet account for jungle provider', async () => {
    const authProvider = new EosioAuthProvider(jungleProvider, telosTestnetAccount)
    await expect(authProvider.createLink(did)).rejects.toThrow()
  })
})

describe('authenticate', () => {
  test('Telos Testnet', async () => {
    const authProvider = new EosioAuthProvider(telosTestnetProvider, telosTestnetAccount)
    await expect(authProvider.authenticate('msg')).resolves.toMatchSnapshot()
  })

  test('Jungle', async () => {
    const authProvider = new EosioAuthProvider(jungleProvider, jungleAccount)
    await expect(authProvider.authenticate('msg')).resolves.toMatchSnapshot()
  })
})
