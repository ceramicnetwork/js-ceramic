import { AccountID } from "caip";
import { AuthProvider } from "./auth-provider";
import { 
  encodeRpcMessage,
  RpcMessage,
  LinkProof,
  getConsentMessage
} from "./util";
import * as uint8arrays from "uint8arrays";
import * as sha256 from "@stablelib/sha256";

const CHAIN_NAMESPACE = "EIP155";

export class AvalancheAuthProvider implements AuthProvider {
  readonly isAuthProvider = true;

  constructor(
    private readonly provider: any,
    private readonly address: string
  ) {}

  async accountId() {
    const payload = encodeRpcMessage("eth_chainId", []);
    const chainIdHex = await safeSend(payload, this.provider);
    const chainId = parseInt(chainIdHex, 16);
    return new AccountID({
      address: this.address,
      chainId: `${CHAIN_NAMESPACE}:${chainId}`
    })
  }

  async authenticate(message: string): Promise<string> {
    const accountId = await this.accountId();
    if (accountId) {
      accountId.address = accountId.address.toLowerCase();
    }
    if (this.provider.isAuthereum) {
      return this.provider.signMessageWithSigningKey(message);
    }
    const hexMessage = utf8toHex(message);
    const payload = encodeRpcMessage("personal_sign", [
      hexMessage,
      accountId.address
    ]);
    const signature = await safeSend(payload, this.provider);
    const signatureBytes = uint8arrays.fromString(signature.slice(2))
    const digest = sha256.hash(signatureBytes)
    return `0x${uint8arrays.toString(digest, 'base16')}`;
  }

  async createLink(did: string): Promise<LinkProof> {
    const accountId = await this.accountId();
    accountId.address = accountId.address.toLowerCase();
    const {message, timestamp } = getConsentMessage(did)
    const hexMessage = utf8toHex(message);
    const payload = encodeRpcMessage("personal_sign", [
      hexMessage,
      accountId.address
    ])
    const signature = await safeSend(payload, this.provider);
    const proof: LinkProof = {
      version: 2,
      type: "ethereum-eoa",
      message,
      signature,
      account: accountId.toString(),
      timestamp: timestamp
    }
    return proof;
  }

  withAddress(address: string): AuthProvider {
    return new AvalancheAuthProvider(this.provider, address);
  }
}

function utf8toHex(message: string): string {
  const bytes = uint8arrays.fromString(message);
  const hex = uint8arrays.toString(bytes, "base16");
  return "0x" + hex;
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
