import { AuthProvider } from './auth-provider.js'
import { AccountId } from 'caip'
import {
  CapabilityOpts,
  asOldCaipString,
  encodeRpcMessage,
  getConsentMessage,
  LinkProof,
} from './util.js'
import * as uint8arrays from 'uint8arrays'
import * as sha256 from '@stablelib/sha256'
import { StreamID } from '@ceramicnetwork/streamid'
import { randomString } from '@stablelib/random'
import { Cacao, SiweMessage } from '@didtools/cacao'

const ADDRESS_TYPES = {
  ethereumEOA: 'ethereum-eoa',
  erc1271: 'erc1271',
}

type EthProviderOpts = {
  eoaSignAccount?: string
}

const CHAIN_NAMESPACE = 'eip155'

const chainIdCache = new WeakMap<any, number>()
async function requestChainId(provider: any): Promise<number> {
  let chainId = chainIdCache.get(provider)
  if (!chainId) {
    const chainIdHex = await safeSend(provider, 'eth_chainId', [])
    chainId = parseInt(chainIdHex, 16)
    chainIdCache.set(provider, chainId)
  }
  return chainId
}

/**
 *  AuthProvider which can be used for Ethereum providers with standard interface
 */
export class EthereumAuthProvider implements AuthProvider {
  readonly isAuthProvider = true
  private _accountId: AccountId | undefined

  constructor(
    private readonly provider: any,
    private readonly address: string,
    private readonly opts: EthProviderOpts = {}
  ) {}

  async accountId(): Promise<AccountId> {
    if (!this._accountId) {
      const chainId = await requestChainId(this.provider)
      this._accountId = new AccountId({
        address: this.address,
        chainId: `${CHAIN_NAMESPACE}:${chainId}`,
      })
    }
    return this._accountId
  }

  async authenticate(message: string): Promise<string> {
    const accountId = await this.accountId()
    return authenticate(message, accountId, this.provider)
  }

  async createLink(did: string): Promise<LinkProof> {
    const accountId = await this.accountId()
    return createLink(did, accountId, this.provider, this.opts)
  }

  async requestCapability(
    sessionDID: string,
    streams: Array<StreamID | string>,
    opts: CapabilityOpts = {}
  ): Promise<Cacao> {
    console.warn(
      'WARN: requestCapability os an experimental API, that is subject to change any time.'
    )

    const domain = typeof window !== 'undefined' ? window.location.hostname : opts.domain
    if (!domain) throw new Error("Missing parameter 'domain'")

    // NOTE: To allow proper customization of the expiry date, we need a solid library to represent
    // time durations that includes edge cases. We should not try dealing with timestamps ourselves.
    const now = new Date()
    const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const siweMessage = new SiweMessage({
      domain: domain,
      address: this.address,
      statement: opts.statement ?? 'Give this application access to some of your data on Ceramic',
      uri: sessionDID,
      version: opts.version ?? '1',
      nonce: opts.nonce ?? randomString(10),
      issuedAt: now.toISOString(),
      expirationTime: opts.expirationTime ?? oneDayLater.toISOString(),
      chainId: (await this.accountId()).chainId.reference,
      resources: (opts.resources ?? []).concat(
        streams.map((s) => (typeof s === 'string' ? StreamID.fromString(s) : s).toUrl())
      ),
    })

    if (opts.requestId) siweMessage.requestId = opts.requestId

    const account = await this.accountId()
    const signature = await safeSend(this.provider, 'personal_sign', [
      siweMessage.signMessage(),
      account.address,
    ])
    siweMessage.signature = signature
    const cacao = Cacao.fromSiweMessage(siweMessage)
    return cacao
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

export async function isERC1271(account: AccountId, provider: any): Promise<boolean> {
  const bytecode = await getCode(account.address, provider).catch(() => null)
  return Boolean(bytecode && bytecode !== '0x' && bytecode !== '0x0' && bytecode !== '0x00')
}

export function normalizeAccountId(input: AccountId): AccountId {
  return new AccountId({
    address: input.address.toLowerCase(),
    chainId: input.chainId,
  })
}

function utf8toHex(message: string): string {
  const bytes = uint8arrays.fromString(message)
  const hex = uint8arrays.toString(bytes, 'base16')
  return '0x' + hex
}

async function createEthLink(
  did: string,
  account: AccountId,
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
    account: asOldCaipString(account),
  }
  if (!opts.skipTimestamp) proof.timestamp = timestamp
  return proof
}

async function validateChainId(account: AccountId, provider: any): Promise<void> {
  const chainId = await requestChainId(provider)
  if (chainId !== parseInt(account.chainId.reference)) {
    throw new Error(
      `ChainId in provider (${chainId}) is different from AccountId (${account.chainId.reference})`
    )
  }
}

async function createErc1271Link(
  did: string,
  account: AccountId,
  provider: any,
  opts: any
): Promise<LinkProof> {
  const ethLinkAccount = opts?.eoaSignAccount || account
  const res = await createEthLink(did, ethLinkAccount, provider, opts)
  await validateChainId(account, provider)
  return Object.assign(res, {
    type: ADDRESS_TYPES.erc1271,
    account: asOldCaipString(account),
  })
}

export async function createLink(
  did: string,
  account: AccountId,
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
  account: AccountId,
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
