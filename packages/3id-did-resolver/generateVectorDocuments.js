/**
 * This is the script that was used to generate the test vectors currently
 * used by the 3id-did-resolver tests. This is just a simple javascript
 * file here in case the tests vectors need to be recreated in the future.
 * To run this script make sure you have all the dependencies instralled
 * and run it using $ node generateVectorDocuments.js
 *
 * The result of this script, which is a commit log for a 3IDv0 and a 3IDv1,
 * can be found in the 'vectorDocuments.json' file in the test folder.
 */

const Ceramic = require('@ceramicnetwork/http-client').default
const ThreeIdProvider = require('3id-did-provider').default
const ThreeIdResolver = require('@ceramicnetwork/3id-did-resolver').default
const KeyDidResolver = require('key-did-resolver').default
const { Resolver } = require('did-resolver')
const { DID } = require('dids')
const TileDoctype = require('@ceramicnetwork/doctype-tile').default
const u8a = require('uint8arrays')
const { randomBytes } = require('@stablelib/random')
const dagCBOR = require('ipld-dag-cbor')
const EC = require('elliptic').ec
const ec = new EC('secp256k1')
const { Ed25519Provider } = require('key-did-provider-ed25519')


const getPermission = async () => []
const multicodecPubkeyTable = {
  secp256k1: 0xe7,
  x25519: 0xec,
  ed25519: 0xed,
}
function encodeKey(key, keyType) {
  const bytes = new Uint8Array(key.length + 2)
  if (!multicodecPubkeyTable[keyType]) {
    throw new Error(`Key type "${keyType}" not supported.`)
  }
  bytes[0] = multicodecPubkeyTable[keyType]
  // The multicodec is encoded as a varint so we need to add this.
  // See js-multicodec for a general implementation
  bytes[1] = 0x01
  bytes.set(key, 2)
  return `z${u8a.toString(bytes, 'base58btc')}`
}

const legacyDoc = {
  "id":"did:3:GENESIS",
  "@context":"https://w3id.org/did/v1",
  "publicKey":[{
    "id":"did:3:GENESIS#signingKey",
    "type":"Secp256k1VerificationKey2018",
    "publicKeyHex":"..."
  }, {
    "id":"did:3:GENESIS#encryptionKey",
    "type":"Curve25519EncryptionPublicKey",
    "publicKeyBase64":".../ItLDc="
  },{
    "id":"did:3:GENESIS#managementKey",
    "type":"Secp256k1VerificationKey2018",
    "ethereumAddress":"0x3f0bb6247d647a30f310025662b29e6fa382b61d"
  }],
  "authentication":[{
    "type":"Secp256k1SignatureAuthentication2018",
    "publicKey":"did:3:GENESIS#signingKey"
  }]
}


const waitForAnchor = doc => new Promise(resolve => {
  console.log('waiting for anchor')
  let iid = setInterval(async () => {
    await doc._syncState()
  }, 40000)
  doc.on('change', () => {
    console.log(new Date(doc.state.anchorScheduledFor))
    console.log(doc.state.anchorStatus)
    if (doc.state.anchorStatus === 3) {
      clearInterval(iid)
      resolve()
    }
  })
})

const makeDID = function(provider, ceramic) {
  const keyDidResolver = KeyDidResolver.getResolver()
  const threeIdResolver = ThreeIdResolver.getResolver(ceramic)
  const resolver = new Resolver({
    ...threeIdResolver, ...keyDidResolver,
  })
  return new DID({ provider, resolver })
}

const setLegacyDoc = async (ceramic, doc, keyset) => {
  const signing = encodeKey(keyset.signingPub, 'secp256k1')
  const encryption = encodeKey(keyset.encPub, 'x25519')
  const oldProvider = ceramic.did._client.connection
  const provider = new Ed25519Provider(keyset.seed)
  const didWithProvider = makeDID(provider, ceramic)
  const didWithOldProvider = makeDID(oldProvider, ceramic)
  const didstr = didWithProvider.id
  await ceramic.setDID(didWithOldProvider)

  await doc.update(
      { publicKeys: {
          [signing.slice(-15)]: signing,
          [encryption.slice(-15)]: encryption,
        }},
      { controllers: [didstr] })

  await ceramic.setDID(didWithProvider)
  await waitForAnchor(doc)
}

const legacyDid = async (threeId, threeIdGenesisCopy, ceramic) => {
  console.log('Generating a 3IDv0')
  const mgmtKeyPriv = threeIdGenesisCopy.keychain._keyring._keySets.latest.secretKeys.signing
  const mgmtKeyPub = threeIdGenesisCopy.keychain._keyring._keySets.latest.publicKeys.signing
  const encKey = encodeKey(mgmtKeyPub, 'secp256k1')
  const firstKeyDid = 'did:key:' + encKey
  threeIdGenesisCopy.keychain._keyring._keySets.latest.secretKeys.management = mgmtKeyPriv
  threeIdGenesisCopy.keychain._keyring._keySets.latest.publicKeys.management = mgmtKeyPub
  threeIdGenesisCopy.keychain._keyring._versionMap[encKey] = 'latest'

  const keysets = Object.values(threeId.keychain._keyring._keySets).map(ks => {
    return {
      seed: ks.seed,
      signingPub: ks.publicKeys.signing,
      encPub: ks.publicKeys.encryption
    }
  })

  legacyDoc.publicKey[0].publicKeyHex = ec.keyFromPublic(u8a.toString(keysets[0].signingPub, 'base16'), 'hex').getPublic('hex'),
  legacyDoc.publicKey[1].publicKeyBase64 = u8a.toString(keysets[0].encPub, 'base64pad')
  const cid = await dagCBOR.util.cid(dagCBOR.util.serialize(legacyDoc))
  const v03ID = 'did:3:' + cid.toString()

  // uses the first public key of the seed for the v1 threeId as the keydid.
  // sorry for the magic here -.-
  await ceramic.setDID(makeDID(threeIdGenesisCopy.getDidProvider(), ceramic))
  const metadata = { controllers: [firstKeyDid], family: '3id', deterministic: true }
  const doc = await TileDoctype.create(
      ceramic, null, metadata, { anchor:false, publish: false })

  await setLegacyDoc(ceramic, doc, keysets[1])
  console.log('rotated v0 keys once')
  await setLegacyDoc(ceramic, doc, keysets[2])
  console.log('rotated v0 keys twice')
  return {
    v03ID,
    doc,
    legacyDoc
  }
}

const rotateKeys = async (threeId, removeId, addId) => {
  await threeId.keychain.add(addId, randomBytes(32))
  await threeId.keychain.remove(removeId)
  await threeId.keychain.commit()
  const threeDoc = threeId._threeIdx.docs.threeId
  await waitForAnchor(threeDoc)
}

const printDocLog = async (ceramic, doc, did, legacyDoc) => {
  console.log('did:', did)
  console.log('docid:', doc.id)
  const commits = await ceramic.loadDocumentCommits(doc.id)
  console.log('commits:', JSON.stringify(commits))
  if (legacyDoc) {
    console.log('legacy DID doc:', JSON.stringify(legacyDoc))
  }
}

const generate = async () => {
  console.log('Generating a 3IDv1')
  const ceramic = new Ceramic() // uses local node
  const threeId = await ThreeIdProvider.create({ getPermission, authSecret: randomBytes(32), authId: 'a', ceramic })

  const threeIdGenesisCopy = await ThreeIdProvider.create({
    getPermission,
    seed: threeId.keychain._keyring._keySets.latest.seed,
    ceramic,
    disableIDX: true
  })

  await ceramic.setDID(makeDID(threeId.getDidProvider(), ceramic))
  // rotate keys once
  await rotateKeys(threeId, 'a', 'b')
  console.log('rotated v1 keys once')
  // rotate keys again
  await rotateKeys(threeId, 'b', 'c')
  console.log('rotated v1 keys twice')

  // rotate legacy 3ID
  const res = await legacyDid(threeId, threeIdGenesisCopy, ceramic)

  // print data
  const v1doc = threeId._threeIdx.docs.threeId
  await printDocLog(ceramic, v1doc, 'did:3:' + v1doc.id.toString())
  await printDocLog(ceramic, res.doc, res.v03ID, res.legacyDoc)
}

generate()

