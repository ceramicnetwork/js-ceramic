// const get3IdV0Resolver = require('3id-resolver').getResolver
import { getResolver } from '3id-resolver'
import fetch from 'cross-fetch'
import type {  DIDDocument } from 'did-resolver'

interface DAG {
  get(cid: string): any;
}

interface IPFS {
  dag: DAG;
}

interface ProtocolResolver {
  (did: string): DIDDocument;
}

interface ErrorStatus extends Error {
  statusCode?: number;
}

// Legacy 3ids available from 3box, other v1 will always be resolved through ipfs and other services 
const THREEBOX_API_URL = 'https://ipfs.3box.io'

const HTTPError = (status: number, message: string): ErrorStatus => {
  const e: ErrorStatus = new Error(message)
  e.statusCode = status
  return e
}
  
const fetchJson = async (url: string): Promise<any> =>  {
  const r = await fetch(url)
  if (r.ok) {
    return r.json()
  } else {
    throw HTTPError(r.status, (await r.json()).message)
  }
}

const didDocReq = (cid: string): string => `${THREEBOX_API_URL}/did-doc?cid=${encodeURIComponent(cid)}`

// Mocks ipfs obj for 3id resolve, to resolve through api, until ipfs instance is available
const ipfsMock: IPFS = {
  dag: {
    get: async cid => fetchJson(didDocReq(cid))
  }
}

const LegacyResolver = (ipfs?: IPFS): ProtocolResolver => getResolver(ipfs || ipfsMock, { pin: false })['3']

export default LegacyResolver