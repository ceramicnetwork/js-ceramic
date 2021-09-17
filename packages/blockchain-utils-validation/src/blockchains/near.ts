import { AccountID } from 'caip'
import * as nearAPI from 'near-api-js'
import { BlockchainHandler } from '../blockchain-handler'
import { LinkProof } from '@ceramicnetwork/blockchain-utils-linking'
import * as uint8arrays from 'uint8arrays'
import crypto from 'crypto'
import nacl from 'tweetnacl'

const stringEncode = (str: string): Uint8Array =>
  uint8arrays.fromString(str, 'base64pad')

const namespace = 'near'
const networkId = 'testnet'
const nodeUrl = 'https://rpc.testnet.near.org'
const walletUrl = 'https://wallet.testnet.near.org'

const makeUint8 = (str: string): Uint8Array => {
  const utf8Encode = new TextEncoder()
  return utf8Encode.encode(str)
}

const verifySignature = async (accountId, data, signature, contractName = '') => {
  
  const near: any = await nearAPI.connect({
    networkId, nodeUrl, walletUrl, deps: { keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore() },
  })

  const nearAccount = await near.account(accountId)

  try {
    const hash = crypto.createHash('sha256').update(data).digest();
    let accessKeys = await nearAccount.getAccessKeys();
    if (contractName.length) {
      accessKeys = accessKeys.filter(({ access_key: { permission }}) => permission && permission.FunctionCall && permission.FunctionCall.receiver_id === contractName);
    } else {
      accessKeys = accessKeys.filter(({ access_key: { permission }}) => permission === 'FullAccess');
    }
    return accessKeys.some(({ public_key }) => {
      const publicKey = public_key.replace('ed25519:', '');
      const decodedPublicKey = uint8arrays.fromString(publicKey, 'base58btc')
      return nacl.sign.detached.verify(hash, Buffer.from(signature, 'base64'), decodedPublicKey);
    })
  } catch (e) {
    console.error(e);
    return false;
  }
};

export async function validateLink(proof: LinkProof): Promise<LinkProof | null> {
  const address = new AccountID(proof.account).address
  const msg = makeUint8(proof.message)
  const sig = stringEncode(proof.signature)
  const is_sig_valid = verifySignature(address, msg, sig);
  return is_sig_valid ? proof : null;
}

const Handler: BlockchainHandler = {
  namespace,
  validateLink,
}

export default Handler
