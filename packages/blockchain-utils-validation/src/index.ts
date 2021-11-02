import { LinkProof } from '@ceramicnetwork/blockchain-utils-linking'
import ethereum from './blockchains/ethereum'
import filecoin from './blockchains/filecoin'
import polkadot from './blockchains/polkadot'
import eosio from './blockchains/eosio'
import cosmos from './blockchains/cosmos'
import near from './blockchains/near'
import tezos from './blockchains/tezos'
import { AccountId } from 'caip'

const handlers = {
  [ethereum.namespace]: ethereum,
  [filecoin.namespace]: filecoin,
  [polkadot.namespace]: polkadot,
  [eosio.namespace]: eosio,
  [cosmos.namespace]: cosmos,
  [near.namespace]: near,
  [tezos.namespace]: tezos,
}

const findDID = (did: string): string | undefined => did.match(/(did:\S+:\S+)/)?.[0]

export async function validateLink(proof: LinkProof): Promise<LinkProof | null> {
  // version < 2 are always eip155 namespace
  let namespace = ethereum.namespace

  // Handle legacy CAIP links
  if (proof.account.includes('@')) {
    const [address, chainId] = proof.account.split('@')
    proof.account = new AccountId({ address, chainId }).toString()
  }

  if (proof.version >= 2) {
    namespace = new AccountId(proof.account).chainId.namespace
  }

  const handler = handlers[namespace]
  if (!handler) throw new Error(`proof with namespace '${namespace}' not supported`)
  const validProof = await handler.validateLink(proof)
  if (validProof) {
    validProof.did = findDID(validProof.message)
    return validProof
  } else {
    return null
  }
}
