import { LinkProof } from '@ceramicnetwork/blockchain-utils-linking'
import { handler as ethereum } from './blockchains/ethereum.js'
import { handler as filecoin } from './blockchains/filecoin.js'
import { handler as polkadot } from './blockchains/polkadot.js'
import { handler as eosio } from './blockchains/eosio.js'
import { handler as cosmos } from './blockchains/cosmos.js'
import { handler as near } from './blockchains/near.js'
import { handler as tezos } from './blockchains/tezos.js'
import { handler as solana } from './blockchains/solana.js'
import { handler as sui } from './blockchains/sui.js'
import { AccountId } from 'caip'
import { normalizeAccountId } from '@ceramicnetwork/common'

const handlers = {
  [ethereum.namespace]: ethereum,
  [filecoin.namespace]: filecoin,
  [polkadot.namespace]: polkadot,
  [eosio.namespace]: eosio,
  [cosmos.namespace]: cosmos,
  [near.namespace]: near,
  [tezos.namespace]: tezos,
  [solana.namespace]: solana,
  [sui.namespace]: sui,
}

const findDID = (did: string): string | undefined => did.match(/(did:\S+:\S+)/)?.[0]

export async function validateLink(proof: LinkProof): Promise<LinkProof | null> {
  // version < 2 are always eip155 namespace
  let namespace = ethereum.namespace

  const proofCopy = { ...proof }

  // Handle legacy CAIP links
  proofCopy.account = normalizeAccountId(proofCopy.account).toString()

  if (proofCopy.version >= 2) {
    namespace = new AccountId(proofCopy.account).chainId.namespace
  }

  const handler = handlers[namespace]
  if (!handler) throw new Error(`proof with namespace '${namespace}' not supported`)
  const validProof = await handler.validateLink(proofCopy)
  if (validProof) {
    validProof.did = findDID(validProof.message)
    return validProof
  } else {
    return null
  }
}
