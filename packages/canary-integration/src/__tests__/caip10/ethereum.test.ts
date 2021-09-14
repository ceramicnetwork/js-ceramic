import ganache from 'ganache-core'
import { encodeRpcMessage, EthereumAuthProvider } from '@ceramicnetwork/blockchain-utils-linking'
import * as sigUtils from 'eth-sig-util'
import { ContractFactory, Contract } from '@ethersproject/contracts'
import * as providers from '@ethersproject/providers'
import { CeramicApi, IpfsApi } from '@ceramicnetwork/common'
import { createIPFS } from '../../create-ipfs'
import { createCeramic } from '../../create-ceramic'
import { Caip10Link } from '@ceramicnetwork/stream-caip10-link'
import { happyPath } from './caip-flows'

const CONTRACT_WALLET_ABI = [
  {
    constant: false,
    inputs: [{ internalType: 'bool', name: 'valid', type: 'bool' }],
    name: 'setIsValid',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { internalType: 'bytes', name: '_messageHash', type: 'bytes' },
      { internalType: 'bytes', name: '_signature', type: 'bytes' },
    ],
    name: 'isValidSignature',
    outputs: [{ internalType: 'bytes4', name: 'magicValue', type: 'bytes4' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
]
const CONTRACT_WALLET_BYTECODE = {
  linkReferences: {},
  object:
    '608060405260008060006101000a81548160ff02191690831515021790555034801561002a57600080fd5b506102938061003a6000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c806317c136771461003b57806320c13b0b1461006b575b600080fd5b6100696004803603602081101561005157600080fd5b8101908080351515906020019092919050505061020f565b005b6101bb6004803603604081101561008157600080fd5b810190808035906020019064010000000081111561009e57600080fd5b8201836020820111156100b057600080fd5b803590602001918460018302840111640100000000831117156100d257600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600081840152601f19601f8201169050808301925050505050505091929192908035906020019064010000000081111561013557600080fd5b82018360208201111561014757600080fd5b8035906020019184600183028401116401000000008311171561016957600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600081840152601f19601f82011690508083019250505050505050919291929050505061022b565b60405180827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19167bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916815260200191505060405180910390f35b806000806101000a81548160ff02191690831515021790555050565b60008060009054906101000a900460ff1615610250576320c13b0b60e01b9050610258565b600060e01b90505b9291505056fea265627a7a723158209d7aa06b7443aa12cee8b1ba4356af624de6b912d6af47b494c9b9d621b883ac64736f6c634300050b0032',
  opcodes:
    'PUSH1 0x80 PUSH1 0x40 MSTORE PUSH1 0x0 DUP1 PUSH1 0x0 PUSH2 0x100 EXP DUP2 SLOAD DUP2 PUSH1 0xFF MUL NOT AND SWAP1 DUP4 ISZERO ISZERO MUL OR SWAP1 SSTORE POP CALLVALUE DUP1 ISZERO PUSH2 0x2A JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0x293 DUP1 PUSH2 0x3A PUSH1 0x0 CODECOPY PUSH1 0x0 RETURN INVALID PUSH1 0x80 PUSH1 0x40 MSTORE CALLVALUE DUP1 ISZERO PUSH2 0x10 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH1 0x4 CALLDATASIZE LT PUSH2 0x36 JUMPI PUSH1 0x0 CALLDATALOAD PUSH1 0xE0 SHR DUP1 PUSH4 0x17C13677 EQ PUSH2 0x3B JUMPI DUP1 PUSH4 0x20C13B0B EQ PUSH2 0x6B JUMPI JUMPDEST PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0x69 PUSH1 0x4 DUP1 CALLDATASIZE SUB PUSH1 0x20 DUP2 LT ISZERO PUSH2 0x51 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 ADD SWAP1 DUP1 DUP1 CALLDATALOAD ISZERO ISZERO SWAP1 PUSH1 0x20 ADD SWAP1 SWAP3 SWAP2 SWAP1 POP POP POP PUSH2 0x20F JUMP JUMPDEST STOP JUMPDEST PUSH2 0x1BB PUSH1 0x4 DUP1 CALLDATASIZE SUB PUSH1 0x40 DUP2 LT ISZERO PUSH2 0x81 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 ADD SWAP1 DUP1 DUP1 CALLDATALOAD SWAP1 PUSH1 0x20 ADD SWAP1 PUSH5 0x100000000 DUP2 GT ISZERO PUSH2 0x9E JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP3 ADD DUP4 PUSH1 0x20 DUP3 ADD GT ISZERO PUSH2 0xB0 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP1 CALLDATALOAD SWAP1 PUSH1 0x20 ADD SWAP2 DUP5 PUSH1 0x1 DUP4 MUL DUP5 ADD GT PUSH5 0x100000000 DUP4 GT OR ISZERO PUSH2 0xD2 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST SWAP2 SWAP1 DUP1 DUP1 PUSH1 0x1F ADD PUSH1 0x20 DUP1 SWAP2 DIV MUL PUSH1 0x20 ADD PUSH1 0x40 MLOAD SWAP1 DUP2 ADD PUSH1 0x40 MSTORE DUP1 SWAP4 SWAP3 SWAP2 SWAP1 DUP2 DUP2 MSTORE PUSH1 0x20 ADD DUP4 DUP4 DUP1 DUP3 DUP5 CALLDATACOPY PUSH1 0x0 DUP2 DUP5 ADD MSTORE PUSH1 0x1F NOT PUSH1 0x1F DUP3 ADD AND SWAP1 POP DUP1 DUP4 ADD SWAP3 POP POP POP POP POP POP POP SWAP2 SWAP3 SWAP2 SWAP3 SWAP1 DUP1 CALLDATALOAD SWAP1 PUSH1 0x20 ADD SWAP1 PUSH5 0x100000000 DUP2 GT ISZERO PUSH2 0x135 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP3 ADD DUP4 PUSH1 0x20 DUP3 ADD GT ISZERO PUSH2 0x147 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP1 CALLDATALOAD SWAP1 PUSH1 0x20 ADD SWAP2 DUP5 PUSH1 0x1 DUP4 MUL DUP5 ADD GT PUSH5 0x100000000 DUP4 GT OR ISZERO PUSH2 0x169 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST SWAP2 SWAP1 DUP1 DUP1 PUSH1 0x1F ADD PUSH1 0x20 DUP1 SWAP2 DIV MUL PUSH1 0x20 ADD PUSH1 0x40 MLOAD SWAP1 DUP2 ADD PUSH1 0x40 MSTORE DUP1 SWAP4 SWAP3 SWAP2 SWAP1 DUP2 DUP2 MSTORE PUSH1 0x20 ADD DUP4 DUP4 DUP1 DUP3 DUP5 CALLDATACOPY PUSH1 0x0 DUP2 DUP5 ADD MSTORE PUSH1 0x1F NOT PUSH1 0x1F DUP3 ADD AND SWAP1 POP DUP1 DUP4 ADD SWAP3 POP POP POP POP POP POP POP SWAP2 SWAP3 SWAP2 SWAP3 SWAP1 POP POP POP PUSH2 0x22B JUMP JUMPDEST PUSH1 0x40 MLOAD DUP1 DUP3 PUSH28 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF NOT AND PUSH28 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF NOT AND DUP2 MSTORE PUSH1 0x20 ADD SWAP2 POP POP PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 RETURN JUMPDEST DUP1 PUSH1 0x0 DUP1 PUSH2 0x100 EXP DUP2 SLOAD DUP2 PUSH1 0xFF MUL NOT AND SWAP1 DUP4 ISZERO ISZERO MUL OR SWAP1 SSTORE POP POP JUMP JUMPDEST PUSH1 0x0 DUP1 PUSH1 0x0 SWAP1 SLOAD SWAP1 PUSH2 0x100 EXP SWAP1 DIV PUSH1 0xFF AND ISZERO PUSH2 0x250 JUMPI PUSH4 0x20C13B0B PUSH1 0xE0 SHL SWAP1 POP PUSH2 0x258 JUMP JUMPDEST PUSH1 0x0 PUSH1 0xE0 SHL SWAP1 POP JUMPDEST SWAP3 SWAP2 POP POP JUMP INVALID LOG2 PUSH6 0x627A7A723158 KECCAK256 SWAP14 PUSH27 0xA06B7443AA12CEE8B1BA4356AF624DE6B912D6AF47B494C9B9D621 0xb8 DUP4 0xac PUSH5 0x736F6C6343 STOP SDIV SIGNEXTEND STOP ORIGIN ',
  sourceMap:
    '0:350:0:-;;;46:5;31:20;;;;;;;;;;;;;;;;;;;;0:350;8:9:-1;5:2;;;30:1;27;20:12;5:2;0:350:0;;;;;;;',
}
const GANACHE_CONF = {
  seed: '0xd30553e27ba2954e3736dae1342f5495798d4f54012787172048582566938f6f',
}
const send = (provider: any, data: any): Promise<any> =>
  new Promise((resolve, reject) =>
    provider.send(data, (err: any, res: any) => {
      if (err) reject(err)
      else resolve(res.result)
    })
  )

const provider: any = ganache.provider(GANACHE_CONF)

const lazyProvider = () => provider // Required for the Jest mock below
jest.mock('@ethersproject/providers', () => {
  const originalModule = jest.requireActual('@ethersproject/providers')
  const getNetwork = (): any => {
    return {
      _defaultProvider: (): any => {
        return new originalModule.Web3Provider(lazyProvider())
      },
    }
  }
  return {
    ...originalModule,
    getNetwork,
  }
})
let addresses: string[]
let contractAddress: string
let ceramic: CeramicApi
let ipfs: IpfsApi

beforeEach(async () => {
  addresses = await send(provider, encodeRpcMessage('eth_accounts'))
  // ganache-core doesn't support personal_sign -.-
  provider.manager.personal_sign = (data: any, address: string, callback: any): void => {
    // next line is hack to make contract address to personal sign
    if (address === contractAddress.toLowerCase()) address = addresses[0]
    const account = provider.manager.state.accounts[address.toLowerCase()]
    const result = sigUtils.personalSign(account.secretKey, { data })
    callback(null, result)
  }
  // deploy contract wallet
  const factory = new ContractFactory(CONTRACT_WALLET_ABI, CONTRACT_WALLET_BYTECODE)
  const hexNonce = await send(
    provider,
    encodeRpcMessage('eth_getTransactionCount', [addresses[0], 'pending'])
  )
  const nonce = parseInt(hexNonce.replace('0x', ''), 16)
  const unsignedTx = Object.assign(factory.getDeployTransaction(), {
    from: addresses[0],
    gas: 4712388,
    gasPrice: 100000000000,
    nonce: nonce,
  })
  await send(provider, encodeRpcMessage('eth_sendTransaction', [unsignedTx]))
  contractAddress = Contract.getContractAddress(unsignedTx)
  ceramic = await createCeramic(ipfs)
}, 120000)

afterEach(async () => {
  await ceramic.close()
}, 120000)

beforeAll(async () => {
  ipfs = await createIPFS()
}, 120000)

afterAll(async () => {
  await ipfs?.stop()
}, 120000)

describe('externally-owned account', () => {
  test('happy scenario', async () => {
    const authProvider = new EthereumAuthProvider(provider, addresses[0])
    await happyPath(ceramic, authProvider)
  }, 120000)
  test('invalid proof', async () => {
    const authProvider = new EthereumAuthProvider(provider, addresses[0])
    const accountId = await authProvider.accountId()
    accountId.address = addresses[1]
    const caip = await Caip10Link.fromAccount(ceramic, accountId)
    await expect(caip.setDid(ceramic.did, authProvider)).rejects.toThrow(
      /Address doesn't match stream controller/
    )
  }, 120000)
})

describe('contract account', () => {
  test('happy scenario', async () => {
    const contract = new Contract(
      contractAddress,
      CONTRACT_WALLET_ABI,
      new providers.Web3Provider(provider)
    )
    let tx = await contract.populateTransaction.setIsValid(true)
    tx = Object.assign(tx, {
      from: addresses[0],
      gas: 4712388,
      gasPrice: 100000000000,
    })
    await send(provider, encodeRpcMessage('eth_sendTransaction', [tx]))
    const authProvider = new EthereumAuthProvider(provider, contractAddress)
    await happyPath(ceramic, authProvider)
  }, 120000)

  test('wrong proof', async () => {
    const contract = new Contract(
      contractAddress,
      CONTRACT_WALLET_ABI,
      new providers.Web3Provider(provider)
    )
    let tx = await contract.populateTransaction.setIsValid(true)
    tx = Object.assign(tx, {
      from: addresses[0],
      gas: 4712388,
      gasPrice: 100000000000,
    })
    await send(provider, encodeRpcMessage('eth_sendTransaction', [tx]))
    const authProvider = new EthereumAuthProvider(provider, contractAddress)
    const accountId = await authProvider.accountId()
    accountId.address = addresses[1]
    const caip = await Caip10Link.fromAccount(ceramic, accountId)
    await expect(caip.setDid(ceramic.did, authProvider)).rejects.toThrow(
      /Address doesn't match stream controller/
    )
  }, 120000)
})
