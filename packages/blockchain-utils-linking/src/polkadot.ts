import { AccountID } from "caip";
import { AuthProvider } from "./auth-provider";
import { getConsentMessage, LinkProof } from "./util";
import * as uint8arrays from "uint8arrays";

const stringHex = (str: string): string =>
  `0x${uint8arrays.toString(uint8arrays.fromString(str), "base16")}`;

const CHAIN_ID = "polkadot:b0a8d493285c2df73290dfb7e61f870f";

export class PolkadotAuthProvider implements AuthProvider {
  readonly isAuthProvider = true;

  constructor(
    private readonly provider: any,
    private readonly address: string
  ) {}

  async authenticate(message: string): Promise<string> {
    throw new Error("Not Implemented");
  }

  async createLink(did: string): Promise<LinkProof> {
    const { message, timestamp } = getConsentMessage(did);
    const linkMessageHex = stringHex(message);
    const account = await this.accountId();
    const res = await this.provider.signRaw({
      address: this.address,
      data: linkMessageHex,
      type: "bytes",
    });
    return {
      version: 2,
      type: "eoa",
      message: linkMessageHex,
      signature: res.signature,
      account: account.toString(),
      timestamp: timestamp,
    };
  }

  async accountId(): Promise<AccountID> {
    return new AccountID({ address: this.address, chainId: CHAIN_ID });
  }

  withAddress(address: string): AuthProvider {
    return new PolkadotAuthProvider(this.provider, address);
  }
}
