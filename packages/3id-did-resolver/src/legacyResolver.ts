import fetch from 'cross-fetch'
import type { DIDDocument } from 'did-resolver'

const DID_PLACEHOLDER = 'GENESIS'
const PUBKEY_IDS = ['signingKey', 'managementKey', 'encryptionKey']

interface DAG {
  get(cid: string): any;
}

interface IPFS {
  dag: DAG;
}

// Legacy 3ids available from 3box, other v1 will always be resolved through ipfs and other services 
const THREEBOX_API_URL = 'https://ipfs.3box.io'
  
const fetchJson = async (url: string): Promise<any> =>  {
  const r = await fetch(url)
  if (r.ok) {
    return r.json()
  } else {
    throw new Error('Not a valid 3ID')  }
}

const didDocReq = (cid: string): string => `${THREEBOX_API_URL}/did-doc?cid=${encodeURIComponent(cid)}`

// Mocks ipfs obj for 3id resolve, to resolve through api, until ipfs instance is available
const ipfsMock: IPFS = {
  dag: {
    get: async cid => fetchJson(didDocReq(cid))
  }
}

const  cidToDocument = async (ipfs: IPFS, documentCid:string): Promise<DIDDocument> => {
  const doc = (await ipfs.dag.get(documentCid)).value
  // If genesis document replace placeholder identifier with cid
  if (doc.id.includes(DID_PLACEHOLDER)) {
    const re = new RegExp(DID_PLACEHOLDER, 'gi')
    doc.id = doc.id.replace(re, documentCid)
    if (doc.publicKey) {
      doc.publicKey = JSON.parse(JSON.stringify(doc.publicKey).replace(re, documentCid))
    }
    if (doc.authentication) {
      doc.authentication = JSON.parse(JSON.stringify(doc.authentication).replace(re, documentCid))
    }
  }
  return doc
}

const validateDoc = (doc: DIDDocument): void =>  {
  if (!doc || !doc.publicKey || !doc.authentication) {
    throw new Error('Not a valid 3ID')
  }
  doc.publicKey.map(entry => {
    const id = entry.id.split('#')[1]
    if (!PUBKEY_IDS.includes(id)) throw new Error('Not a valid 3ID')
  })
}

const LegacyResolver = async (didId: string, ipfs = ipfsMock): Promise<DIDDocument> => {
  const doc = await cidToDocument(ipfs, didId)
  validateDoc(doc)
  return doc 
}

export default LegacyResolver