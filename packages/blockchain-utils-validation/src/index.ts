import { LinkProof } from '@ceramicnetwork/blockchain-utils-linking'
import ethereum from './blockchains/ethereum'
import filecoin from './blockchains/filecoin'
import polkadot from './blockchains/polkadot'
import eosio from './blockchains/eosio'
import cosmos from './blockchains/cosmos'
import near from './blockchains/near'
import tezos from './blockchains/tezos'
import { AccountID } from 'caip'

const handlers = {
  [ethereum.namespace]: ethereum,
  [filecoin.namespace]: filecoin,
  [polkadot.namespace]: polkadot,
  [eosio.namespace]: eosio,
  [cosmos.namespace]: cosmos,
  [near.namespace]: near,
  [tezos.namespace]: tezos,
}

// TODO: remove and use did-resolver parse instead
// https://github.com/decentralized-identity/did-resolver/blob/master/src/resolver.ts#L167
const PCT_ENCODED = '(?:%[0-9a-fA-F]{2})'
const ID_CHAR = `(?:[a-zA-Z0-9._-]|${PCT_ENCODED})`
const METHOD = '([a-z0-9]+)'
const METHOD_ID = `((?:${ID_CHAR}*:)*(${ID_CHAR}+))`
const DID_REGEX = new RegExp(`did:${METHOD}:${METHOD_ID}`)

const findDID = (did: string): string | undefined => did.match(DID_REGEX)?.[0]

export async function validateLink(proof: LinkProof): Promise<LinkProof | null> {
  // version < 2 are always eip155 namespace
  let namespace = ethereum.namespace
  if (proof.version >= 2) {
    namespace = new AccountID(proof.account).chainId.namespace
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
