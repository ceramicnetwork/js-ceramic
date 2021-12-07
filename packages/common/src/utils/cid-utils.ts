import { CID } from 'multiformats/cid'

export function toCID(givenCid: string | CID | Uint8Array): CID {
  const cid = CID.asCID(givenCid)

  if (cid) {
    return cid
  }

  if (typeof givenCid === 'string') {
    return CID.parse(givenCid)
  }

  if (givenCid instanceof Uint8Array) {
    return CID.decode(givenCid)
  }

  throw new Error(`${givenCid} cannot be converted to a CID`)
}
