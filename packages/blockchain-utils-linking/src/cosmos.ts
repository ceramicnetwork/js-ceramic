import { AccountID } from 'caip';
import { AuthProvider } from './auth-provider';
import { getConsentMessage, LinkProof } from './util';
import { Tx, SignMeta } from '@tendermint/sig';
import { hash } from '@stablelib/sha256';
import * as uint8arrays from 'uint8arrays';

const CHAIN_ID = "cosmos:cosmoshub-3";

const stringEncode = (str: string): string => uint8arrays.toString(uint8arrays.fromString(str), 'base64pad');

// return data in the cosmos unsigned transaction format
function asTransaction(address: string, message: string): Tx {
  return {
    fee: {
      amount: [{ amount: '0', denom: '' }],
      gas: '0',
    },
    memo: message,
    msg: [
      {
        type: 'cosmos-sdk/MsgSend',
        value: {
          from_address: address,
          to_address: address,
          amount: [{ amount: '0', denom: '0' }],
        },
      },
    ],
  };
}

// generate metadata for signing the transaction
function getMetaData(): SignMeta {
  return {
    account_number: '1',
    chain_id: 'cosmos',
    sequence: '0',
  };
}

export class CosmosAuthProvider implements AuthProvider {
  readonly isAuthProvider = true;

  constructor(
    private readonly provider: any, 
    private readonly address: string) {}

  async authenticate(message: string): Promise<string> {
    const accountID = await this.accountId();
    const encodedMsg = stringEncode(message);
    const res = await this.provider.sign(asTransaction(accountID.address, encodedMsg), getMetaData());
    const digest = hash(uint8arrays.fromString(JSON.stringify(res.signatures[0])))
    return `0x${uint8arrays.toString(digest, 'base16')}`
  }

  async createLink(did: string): Promise<LinkProof> {
    const { message, timestamp } = getConsentMessage(did);
    const accountID = await this.accountId();
    const encodedMsg = stringEncode(message);
    const res = await this.provider.sign(asTransaction(accountID.address, encodedMsg), getMetaData());
    const signature = stringEncode(JSON.stringify(res.signatures[0]));
    const proof: LinkProof = {
      version: 1,
      type: 'cosmos',
      message,
      signature,
      account: accountID.toString(),
      timestamp,
    };
    return proof;
  }

  async accountId(): Promise<AccountID> {
    return new AccountID({
      address: this.address,
      chainId: CHAIN_ID,
    });
  }

  withAddress(address: string): AuthProvider {
    return new CosmosAuthProvider(this.provider, address);
  }
}
