import { AccountID } from 'caip';
import { AuthProvider } from './auth-provider';
import { getConsentMessage, LinkProof } from './util';
import { hash } from '@stablelib/sha256';
import * as uint8arrays from 'uint8arrays';

const stringEncode = (str: string): string => uint8arrays.toString(uint8arrays.fromString(str), 'base64pad');

// REF: near.org
export class NearAuthProvider implements AuthProvider {
  readonly isAuthProvider = true;

  constructor(
    private readonly provider: any,
    // NOTE: address here is: ed25519 public key
    private readonly address: string,
    private readonly chainRef: string) {}

  async authenticate(message: string): Promise<string> {
    const encodedMsg = stringEncode(message);
    const { signature } = await this.provider.sign(encodedMsg);
    const digest = hash(signature);
    return `0x${uint8arrays.toString(digest, 'base16')}`
  }

  async createLink(did: string): Promise<LinkProof> {
    const { message, timestamp } = getConsentMessage(did);
    const encodedMsg = stringEncode(message);
    const { signature, account } = await this.provider.sign(encodedMsg);
    const proof: LinkProof = {
      version: 1,
      message,
      signature,
      account,
      timestamp,
    };
    return proof;
  }

  async accountId(): Promise<AccountID> {
    return new AccountID({
      address: this.address,
      chainId: `near:${this.chainRef}`,
    });
  }

  // NOTE: address here is: ed25519 public key
  withAddress(address: string): AuthProvider {
    return new NearAuthProvider(this.provider, address, this.chainRef);
  }
}