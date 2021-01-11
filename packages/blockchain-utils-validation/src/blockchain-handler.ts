import { LinkProof } from "@ceramicnetwork/blockchain-utils-linking";

export interface BlockchainHandler {
  namespace: string;
  validateLink(proof: LinkProof): Promise<LinkProof | null>;
}
