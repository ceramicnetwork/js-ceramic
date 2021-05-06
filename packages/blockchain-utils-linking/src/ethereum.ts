import { AuthProvider } from "./auth-provider";
import { AccountID } from "caip";
import {
  encodeRpcMessage,
  getConsentMessage,
  LinkProof,
  RpcMessage,
} from "./util";
import * as uint8arrays from "uint8arrays";
import * as sha256 from '@stablelib/sha256'

const ADDRESS_TYPES = {
  ethereumEOA: "ethereum-eoa",
  erc1271: "erc1271",
};

type EthProviderOpts = {
  eoaSignAccount?: string
}

const CHAIN_NAMESPACE = "eip155";

/**
 *  AuthProvider which can be used for Ethereum providers with standard interface
 */
export class EthereumAuthProvider implements AuthProvider {
  readonly isAuthProvider = true;

  constructor(
      private readonly provider: any,
      private readonly address: string,
      private readonly opts: EthProviderOpts = {}
  ) {}

  async accountId() {
    const payload = encodeRpcMessage("eth_chainId", []);
    const chainIdHex = await safeSend(payload, this.provider);
    const chainId = parseInt(chainIdHex, 16);
    return new AccountID({
      address: this.address,
      chainId: `${CHAIN_NAMESPACE}:${chainId}`,
    });
  }

  async authenticate(message: string): Promise<string> {
    const accountId = await this.accountId();
    return authenticate(message, accountId, this.provider);
  }

  async createLink(did: string): Promise<LinkProof> {
    const accountId = await this.accountId();
    return createLink(did, accountId, this.provider, this.opts);
  }

  withAddress(address: string): AuthProvider {
    return new EthereumAuthProvider(this.provider, address);
  }
}

export function isEthAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

async function getCode(address: string, provider: any): Promise<string> {
  const payload = encodeRpcMessage("eth_getCode", [address, "latest"]);
  return safeSend(payload, provider);
}

async function safeSend(data: RpcMessage, provider: any): Promise<any> {
  const send = (provider.sendAsync ? provider.sendAsync : provider.send).bind(
      provider
  );
  return new Promise((resolve, reject) => {
    send(data, function (err: any, result: any) {
      if (err) reject(err);
      else if (result.error) reject(result.error);
      else resolve(result.result);
    });
  });
}

export async function isERC1271(
    account: AccountID,
    provider: any
): Promise<boolean> {
  const bytecode = await getCode(account.address, provider).catch(() => null);
  return Boolean(
      bytecode && bytecode !== "0x" && bytecode !== "0x0" && bytecode !== "0x00"
  );
}

export function normalizeAccountId(account: AccountID): AccountID {
  account.address = account.address.toLowerCase();
  return account;
}

function utf8toHex(message: string): string {
  const bytes = uint8arrays.fromString(message);
  const hex = uint8arrays.toString(bytes, "base16");
  return "0x" + hex;
}

async function createEthLink(
    did: string,
    account: AccountID,
    provider: any,
    opts: any = {}
): Promise<LinkProof> {
  const { message, timestamp } = getConsentMessage(did, !opts.skipTimestamp);
  const hexMessage = utf8toHex(message);
  const payload = encodeRpcMessage("personal_sign", [
    hexMessage,
    account.address,
  ]);
  const signature = await safeSend(payload, provider);
  const proof: LinkProof = {
    version: 2,
    type: ADDRESS_TYPES.ethereumEOA,
    message,
    signature,
    account: account.toString(),
  };
  if (!opts.skipTimestamp) proof.timestamp = timestamp;
  return proof;
}

async function validateChainId(
    account: AccountID,
    provider: any
): Promise<void> {
  const payload = encodeRpcMessage("eth_chainId", []);
  const chainIdHex = await safeSend(payload, provider);
  const chainId = parseInt(chainIdHex, 16);
  if (chainId !== parseInt(account.chainId.reference)) {
    throw new Error(
        `ChainId in provider (${chainId}) is different from AccountID (${account.chainId.reference})`
    );
  }
}

async function createErc1271Link(
    did: string,
    account: AccountID,
    provider: any,
    opts: any
): Promise<LinkProof> {
  const ethLinkAccount = opts?.eoaSignAccount || account;
  const res = await createEthLink(did, ethLinkAccount, provider, opts);
  await validateChainId(account, provider);
  return Object.assign(res, {
    type: ADDRESS_TYPES.erc1271,
    account: account.toString(),
  });
}

export async function createLink(
    did: string,
    account: AccountID,
    provider: any,
    opts: any
): Promise<LinkProof> {
  account = normalizeAccountId(account);
  if (await isERC1271(account, provider)) {
    return createErc1271Link(did, account, provider, opts);
  } else {
    return createEthLink(did, account, provider, opts);
  }
}

export async function authenticate(
    message: string,
    account: AccountID,
    provider: any
): Promise<string> {
  if (account) account = normalizeAccountId(account);
  if (provider.isAuthereum) return provider.signMessageWithSigningKey(message);
  const hexMessage = utf8toHex(message);
  const payload = encodeRpcMessage("personal_sign", [
    hexMessage,
    account.address,
  ]);
  const signature = await safeSend(payload, provider);
  const signatureBytes = uint8arrays.fromString(signature.slice(2))
  const digest = sha256.hash(signatureBytes)
  return `0x${uint8arrays.toString(digest, 'base16')}`;
}
