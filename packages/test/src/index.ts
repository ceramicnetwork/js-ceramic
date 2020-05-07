import ThreeIDAccount from '@ceramicnetwork/ceramic-account'
import Ceramic from '@ceramicnetwork/ceramic-core'
import IPFS from 'ipfs'
import IdentityWallet from 'identity-wallet'

import CeramicClient from '@ceramicnetwork/ceramic-http-client'

const did = 'did:3:bafyreicsd4dnkghdrnggxvrrfndf2mdwbyrdqhpzbcsl6fzxnictwqyp34'

async function getCeramic() {
  const seed = '0x5872d6e0ae7347b72c9216db218ebbb9d9d0ae7ab818ead3557e8e78bf944184'
  const ipfs = await IPFS.create({ config: { Bootstrap: [] } })
  const ceramic = await Ceramic.create(ipfs)
  const idWallet = new IdentityWallet(async () => true, { seed })
  await ceramic.setDIDProvider(idWallet.get3idProvider())
  return ceramic
}

async function getCeramicClient() {
  return new CeramicClient()
}

async function main() {
  //
  const ceramic = await getCeramicClient()
  const account = await ThreeIDAccount.build(did, ceramic)
  console.log({tile: 'Account', state: account.ceramicDoc.state})
  for (const prop in account) {
    if (account[prop] && account[prop].ceramicDoc) {
      console.log({tile: prop, state: account[prop].ceramicDoc.state})
    }
  }
}

main()
  .then(() => {
    console.log('MAIN success')
  })
  .catch((e) => {
    console.error('MAIN error:', e)
  })
