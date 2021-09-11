import { verifyMessage } from '@ethersproject/wallet'
import { Contract } from '@ethersproject/contracts'
import * as providers from '@ethersproject/providers'
import { AccountID } from 'caip'
import * as uint8arrays from 'uint8arrays'
import { LinkProof } from '@ceramicnetwork/blockchain-utils-linking'
import { BlockchainHandler } from '../blockchain-handler'

const ADDRESS_TYPES = {
  ethereumEOA: 'ethereum-eoa',
  erc1271: 'erc1271',
}
const ERC1271_ABI = [
  'function isValidSignature(bytes _messageHash, bytes _signature) public view returns (bytes4 magicValue)',
]
const MAGIC_ERC1271_VALUE = '0x20c13b0b'
const namespace = 'eip155'

function utf8toHex(message: string): string {
  const bytes = uint8arrays.fromString(message)
  const hex = uint8arrays.toString(bytes, 'base16')
  return '0x' + hex
}

function getEthersProvider(chainId: string): any {
  const network = providers.getNetwork(chainId)
  if (!network._defaultProvider) throw new Error(`Network with chainId ${chainId} is not supported`)
  return network._defaultProvider(providers)
}

function toV2Proof(proof: LinkProof, address?: string): LinkProof {
  proof.account = new AccountID({
    address: (proof.version === 1 ? proof.address : address) || '',
    chainId: {
      namespace,
      reference: proof.chainId ? proof.chainId.toString() : '1',
    },
  }).toString()
  delete proof.address
  delete proof.chainId
  proof.version = 2
  return proof
}

async function validateEoaLink(proof: LinkProof): Promise<LinkProof | null> {
  const recoveredAddr = verifyMessage(proof.message, proof.signature).toLowerCase()
  if (proof.version !== 2) proof = toV2Proof(proof, recoveredAddr)
  const account = new AccountID(proof.account)
  if (account.address !== recoveredAddr) {
    return null
  }
  return proof
}

async function validateErc1271Link(proof: LinkProof): Promise<LinkProof | null> {
  if (proof.version === 1) proof = toV2Proof(proof)
  const account = new AccountID(proof.account)
  const provider = getEthersProvider(account.chainId.reference)
  const contract = new Contract(account.address, ERC1271_ABI, provider)
  const message = utf8toHex(proof.message)
  const returnValue = await contract.isValidSignature(message, proof.signature)

  return returnValue === MAGIC_ERC1271_VALUE ? proof : null
}

async function validateLink(proof: LinkProof): Promise<LinkProof | null> {
  if (proof.type === ADDRESS_TYPES.erc1271) {
    return await validateErc1271Link(proof)
  } else {
    return await validateEoaLink(proof)
  }
}

const handler: BlockchainHandler = {
  namespace,
  validateLink,
}

export default handler
