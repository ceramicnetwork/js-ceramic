import { AuthProvider } from './auth-provider'
import { AccountID } from 'caip'
import { encodeRpcMessage, getConsentMessage, LinkProof, RpcMessage } from './util'
import * as uint8arrays from 'uint8arrays'
import * as sha256 from '@stablelib/sha256'
import { Ocap, OcapParams, OcapTypes, buildOcapRequestMessage } from './ocap-util'

const ADDRESS_TYPES = {
  ethereumEOA: 'ethereum-eoa',
  erc1271: 'erc1271',
}

type EthProviderOpts = {
  eoaSignAccount?: string
}

const CHAIN_NAMESPACE = 'eip155'

/**
 *  AuthProvider which can be used for Ethereum providers with standard interface
 */
export class EthereumAuthProvider implements AuthProvider {
  readonly isAuthProvider = true

  constructor(
    private readonly provider: any,
    private readonly address: string,
    private readonly opts: EthProviderOpts = {}
  ) {}

  async accountId(): Promise<AccountID> {
    const chainIdHex = await safeSend(this.provider, 'eth_chainId', [])
    const chainId = parseInt(chainIdHex, 16)
    return new AccountID({
      address: this.address,
      chainId: `${CHAIN_NAMESPACE}:${chainId}`,
    })
  }

  async authenticate(message: string): Promise<string> {
    const accountId = await this.accountId()
    return authenticate(message, accountId, this.provider)
  }

  async createLink(did: string): Promise<LinkProof> {
    const accountId = await this.accountId()
    return createLink(did, accountId, this.provider, this.opts)
  }

  async requestCapability(params: OcapParams): Promise<Ocap> {
    console.warn(
      'WARN: requestCapability os an experimental API, that is subject to change any time.'
    )
    const account = await this.accountId()
    const requestMessage = buildOcapRequestMessage({
      ...params,
      address: this.address,
      chainId: account.chainId.toString(),
      type: OcapTypes.EIP4361,
    })
    const payload = encodeRpcMessage('personal_sign', [requestMessage, account.address])
    const signature = await safeSend(payload, this.provider)
    return {
      message: requestMessage,
      signature: signature,
    }
  }

  withAddress(address: string): AuthProvider {
    return new EthereumAuthProvider(this.provider, address)
  }
}

export function isEthAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

async function getCode(address: string, provider: any): Promise<string> {
  return safeSend(provider, 'eth_getCode', [address, 'latest'])
}

function safeSend(provider: any, method: string, params?: Array<any>): Promise<any> {
  if (params == null) {
    params = []
  }

  if (provider.request) {
    return provider.request({ method, params }).then(
      (response) => response,
      (error) => {
        throw error
      }
    )
  } else if (provider.sendAsync || provider.send) {
    const sendFunc = (provider.sendAsync ? provider.sendAsync : provider.send).bind(provider)
    const request = encodeRpcMessage(method, params)
    return new Promise((resolve, reject) => {
      sendFunc(request, (error, response) => {
        if (error) reject(error)

        if (response.error) {
          const error = new Error(response.error.message)
          ;(<any>error).code = response.error.code
          ;(<any>error).data = response.error.data
          reject(error)
        }

        resolve(response.result)
      })
    })
  } else {
    throw new Error(
      `Unsupported provider; provider must implement one of the following methods: send, sendAsync, request`
    )
  }
}

export async function isERC1271(account: AccountID, provider: any): Promise<boolean> {
  const bytecode = await getCode(account.address, provider).catch(() => null)
  return Boolean(bytecode && bytecode !== '0x' && bytecode !== '0x0' && bytecode !== '0x00')
}

export function normalizeAccountId(account: AccountID): AccountID {
  account.address = account.address.toLowerCase()
  return account
}

function utf8toHex(message: string): string {
  const bytes = uint8arrays.fromString(message)
  const hex = uint8arrays.toString(bytes, 'base16')
  return '0x' + hex
}

async function createEthLink(
  did: string,
  account: AccountID,
  provider: any,
  opts: any = {}
): Promise<LinkProof> {
  const { message, timestamp } = getConsentMessage(did, !opts.skipTimestamp)
  const hexMessage = utf8toHex(message)
  const signature = await safeSend(provider, 'personal_sign', [hexMessage, account.address])

  const proof: LinkProof = {
    version: 2,
    type: ADDRESS_TYPES.ethereumEOA,
    message,
    signature,
    account: account.toString(),
  }
  if (!opts.skipTimestamp) proof.timestamp = timestamp
  return proof
}

async function validateChainId(account: AccountID, provider: any): Promise<void> {
  const chainIdHex = await safeSend(provider, 'eth_chainId', [])
  const chainId = parseInt(chainIdHex, 16)
  if (chainId !== parseInt(account.chainId.reference)) {
    throw new Error(
      `ChainId in provider (${chainId}) is different from AccountID (${account.chainId.reference})`
    )
  }
}

async function createErc1271Link(
  did: string,
  account: AccountID,
  provider: any,
  opts: any
): Promise<LinkProof> {
  const ethLinkAccount = opts?.eoaSignAccount || account
  const res = await createEthLink(did, ethLinkAccount, provider, opts)
  await validateChainId(account, provider)
  return Object.assign(res, {
    type: ADDRESS_TYPES.erc1271,
    account: account.toString(),
  })
}

export async function createLink(
  did: string,
  account: AccountID,
  provider: any,
  opts: any
): Promise<LinkProof> {
  account = normalizeAccountId(account)
  if (await isERC1271(account, provider)) {
    return createErc1271Link(did, account, provider, opts)
  } else {
    return createEthLink(did, account, provider, opts)
  }
}

export async function authenticate(
  message: string,
  account: AccountID,
  provider: any
): Promise<string> {
  if (account) account = normalizeAccountId(account)
  if (provider.isAuthereum) return provider.signMessageWithSigningKey(message)
  const hexMessage = utf8toHex(message)
  const signature = await safeSend(provider, 'personal_sign', [hexMessage, account.address])
  const signatureBytes = uint8arrays.fromString(signature.slice(2))
  const digest = sha256.hash(signatureBytes)
  return `0x${uint8arrays.toString(digest, 'base16')}`
}
