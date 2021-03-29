import ethereum from "./ethereum";
import { LinkProof } from "@ceramicnetwork/blockchain-utils-linking";
import { BlockchainHandler } from "../blockchain-handler";

const namespace = "eip155";

async function validateLink(proof: LinkProof): Promise<LinkProof | null> {
  return ethereum.validateLink(proof);
}

const handler: BlockchainHandler = {
  namespace,
  validateLink,
};

export default handler;
