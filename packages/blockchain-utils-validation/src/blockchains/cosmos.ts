import { AccountID } from "caip";
import { Tx, SignMeta, verifyTx } from '@tendermint/sig';
import { BlockchainHandler } from "../blockchain-handler";
import type { LinkProof } from "@ceramicnetwork/blockchain-utils-linking";
import * as uint8arrays from "uint8arrays";

const namespace = "cosmos";

const stringEncode = (str: string): string => uint8arrays.toString(uint8arrays.fromString(str), 'base64pad');
const stringDecode = (str: string): string => uint8arrays.toString(uint8arrays.fromString(str, 'base64pad'));

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

export async function validateLink(
  proof: linking.LinkProof
): Promise<linking.LinkProof | null> {
    const account = new AccountID(proof.account);
    const encodedMsg = stringEncode(proof.message);
    const payload = asTransaction(account.address, encodedMsg);
    const sigObj = JSON.parse(stringDecode(proof.signature));
    const Tx = { ...payload, ...getMetaData(), signatures: [sigObj] };
    const is_sig_valid = verifyTx(Tx, getMetaData());
    return is_sig_valid ? proof : null;
}

const Handler: BlockchainHandler = {
  namespace,
  validateLink,
};

export default Handler;
