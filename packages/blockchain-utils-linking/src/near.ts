<<<<<<< HEAD
import { AccountID } from 'caip';
import { AuthProvider } from './auth-provider';
import { getConsentMessage, LinkProof } from './util';
import { hash } from '@stablelib/sha256';
import * as uint8arrays from 'uint8arrays';

const stringEncode = (str: string): string => uint8arrays.toString(uint8arrays.fromString(str), 'base64pad');

// REF: near.org
export class NearAuthProvider implements AuthProvider {
  readonly isAuthProvider = true;
=======
import { AccountID } from 'caip'
import { AuthProvider } from './auth-provider'
import { getConsentMessage, LinkProof } from './util'
import { hash } from '@stablelib/sha256'
import * as uint8arrays from 'uint8arrays'

const stringEncode = (str: string): string =>
  uint8arrays.toString(uint8arrays.fromString(str), 'base64pad')

// REF: near.org
export class NearAuthProvider implements AuthProvider {
  readonly isAuthProvider = true
>>>>>>> 4267d8b31fca38a163bb009198a49e1de22b2a58

  constructor(
    private readonly provider: any,
    // NOTE: address here is: ed25519 public key
    private readonly address: string,
<<<<<<< HEAD
    private readonly chainRef: string) {}

  async authenticate(message: string): Promise<string> {
    const encodedMsg = stringEncode(message);
    const { signature } = await this.provider.sign(encodedMsg);
    const digest = hash(signature);
=======
    private readonly chainRef: string
  ) {}

  async authenticate(message: string): Promise<string> {
    const encodedMsg = stringEncode(message)
    const { signature } = await this.provider.sign(encodedMsg)
    const digest = hash(signature)
>>>>>>> 4267d8b31fca38a163bb009198a49e1de22b2a58
    return `0x${uint8arrays.toString(digest, 'base16')}`
  }

  async createLink(did: string): Promise<LinkProof> {
<<<<<<< HEAD
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
=======
    const { message, timestamp } = getConsentMessage(did)
    const encodedMsg = stringEncode(message)
    const { signature, account } = await this.provider.sign(encodedMsg)
    const caipAccount = new AccountID({
      address: account,
      chainId: `near:${this.chainRef}`,
    })
    return {
      version: 2,
      message,
      signature,
      account: caipAccount.toString(),
      timestamp,
    }
>>>>>>> 4267d8b31fca38a163bb009198a49e1de22b2a58
  }

  async accountId(): Promise<AccountID> {
    return new AccountID({
      address: this.address,
      chainId: `near:${this.chainRef}`,
<<<<<<< HEAD
    });
=======
    })
>>>>>>> 4267d8b31fca38a163bb009198a49e1de22b2a58
  }

  // NOTE: address here is: ed25519 public key
  withAddress(address: string): AuthProvider {
<<<<<<< HEAD
    return new NearAuthProvider(this.provider, address, this.chainRef);
  }
}
=======
    return new NearAuthProvider(this.provider, address, this.chainRef)
  }
}
>>>>>>> 4267d8b31fca38a163bb009198a49e1de22b2a58
