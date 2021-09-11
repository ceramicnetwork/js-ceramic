import { verify } from "@stablelib/ed25519";
import { BlockchainHandler } from "../blockchain-handler";
import { LinkProof } from "@ceramicnetwork/blockchain-utils-linking";
import * as uint8arrays from "uint8arrays";

const stringEncode = (str: string): string => uint8arrays.toString(uint8arrays.fromString(str), 'base64pad');

const namespace = "near";

export async function validateLink(
  proof: LinkProof
): Promise<LinkProof | null> {
  const msg = uint8arrays.fromString(stringEncode(proof.message))
  const sig = uint8arrays.fromString(proof.signature, 'base64pad')
  const acct = uint8arrays.fromString(proof.account, 'base64pad')
  const is_sig_valid: boolean = verify(msg, sig, acct);

  return is_sig_valid ? proof : null;
}

const Handler: BlockchainHandler = {
  namespace,
  validateLink,
};

export default Handler;