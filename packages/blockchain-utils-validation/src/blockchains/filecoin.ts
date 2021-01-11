import { BlockchainHandler } from "../blockchain-handler";
import { AccountID } from "caip";
import * as linking from "@ceramicnetwork/blockchain-utils-linking";
import * as signingTools from '@zondax/filecoin-signing-tools'

const namespace = "fil";

export async function validateLink(
  proof: linking.LinkProof
): Promise<linking.LinkProof | null> {
  const account = new AccountID(proof.account);
  const payload = linking.filecoin.asTransaction(
    account.address,
    proof.message
  );
  const transaction = signingTools.transactionSerialize(payload);
  try {
    const recover = signingTools.verifySignature(proof.signature, transaction);
    if (recover) {
      return proof;
    } else {
      return null;
    }
  } catch {
    return null;
  }
}

const Handler: BlockchainHandler = {
  namespace,
  validateLink,
};

export default Handler;
