import { AccountID } from "caip";
import nacl from "tweetnacl";
import { BlockchainHandler } from "../blockchain-handler";
import { LinkProof } from "@ceramicnetwork/blockchain-utils-linking";
import * as uint8arrays from "uint8arrays";

const namespace = "near";

// const stringEncode = (str: string): string => uint8arrays.toString(uint8arrays.fromString(str), 'base64pad');
// const stringDecode = (str: string): string => uint8arrays.toString(uint8arrays.fromString(str, 'base64pad'));

export async function validateLink(
  proof: LinkProof
): Promise<LinkProof | null> {
  // TODO: Do i need to check if public key exists for this accountId?

  // TODO: make publicKey from near-api-js utils
  const account = new AccountID(proof.account);
  const is_sig_valid: boolean = nacl.sign.detached.verify(
    uint8arrays.fromString(JSON.stringify(proof.message)),
    uint8arrays.fromString(proof.signature),
    uint8arrays.fromString(account.address)
  );

  return is_sig_valid ? proof : null;
}

const Handler: BlockchainHandler = {
  namespace,
  validateLink,
};

export default Handler;
