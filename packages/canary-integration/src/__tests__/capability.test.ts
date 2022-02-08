import { CeramicApi, IpfsApi } from '@ceramicnetwork/common'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { DID } from 'dids'
import { Wallet } from 'ethers'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import PkhDidResolver from 'pkh-did-resolver'
import * as KeyDidResolver from 'key-did-resolver'
import { SiweMessage, Cacao } from 'ceramic-cacao'
import { createCeramic } from '../create-ceramic.js'

let ipfs: IpfsApi
let ceramic: CeramicApi

beforeAll(async () => {
  ipfs = await createIPFS()
  ceramic = await createCeramic(ipfs)
}, 120000)

afterAll(async () => {
  await ipfs.stop()
  await ceramic.close()
})

test('verifies capability with signed commit', async () => {
  /* resolver registry for key did and pkh did
    aud = some key did
    iss = pkh did


    create a DID pkh
    DIDProvider can be {}
    DIDResolver here is pkh-did-resolver
    create a determinstic tiledocument using the pkh did with pkh did as controller
    take its streamid
    create a capability with ^^streamid in resources


    Create a DID Key
    DIDProvider is key-did-provider
    DIDResolver is key-did-resolver
    Create CACAO with did key as aud
    use ethers signer to sign the capability with pkh did related address


    Create new DID key with capability attached ^
    make cacaoblock
    create a dag jws

    
    aud key did creates some commit data
    CacaoBlock goes to IPFS
    TileDocument.update from aud key w/ cap
    spy on verify capability
    ensure it returns cacao as above
    ensure update actually happens */

  // Create a did:pkh for the user
  const wallet = Wallet.fromMnemonic(
    'despair voyage estate pizza main slice acquire mesh polar short desk lyrics'
  )
  const didPkh = new DID({ resolver: PkhDidResolver.default.getResolver() })
  // Create a determinstic tiledocument owned by the user
  const deterministicDocument = await TileDocument.deterministic(ceramic, {
    deterministic: true,
    family: 'testCapabilities',
  })
  const streamId = deterministicDocument.id

  // Create did:key for the dApp
  const seed = new Uint8Array([
    69, 90, 79, 1, 19, 168, 234, 177, 16, 163, 37, 8, 233, 244, 36, 102, 130, 190, 102, 10, 239, 51,
    191, 199, 40, 13, 2, 63, 94, 119, 183, 225,
  ])
  const didKeyProvider = new Ed25519Provider(seed)
  const didKey = new DID({ provider: didKeyProvider, resolver: KeyDidResolver.getResolver() })
  await didKey.authenticate()

  // Create CACAO with did:key as aud
  const siweMessage = new SiweMessage({
    domain: 'service.org',
    address: wallet.address,
    statement: 'I accept the ServiceOrg Terms of Service: https://service.org/tos',
    uri: didKey.id,
    version: '1',
    nonce: '23423423',
    issuedAt: new Date().toISOString(),
    resources: [`ceramic://${streamId.toString()}`],
  })
  const signature = await wallet.signMessage(siweMessage.toMessage())
  siweMessage.signature = signature
  const capability = Cacao.fromSiweMessage(siweMessage)
  // Create new did:key with capability attached
  const didKeyWithCapability = didKey.withCapability(capability)
  await didKeyWithCapability.authenticate()
  await deterministicDocument.update({ foo: 'bar' }, null, {
    asDID: didKeyWithCapability,
    anchor: false,
    publish: false,
  })
  console.log(deterministicDocument.content)
}, 60000)
