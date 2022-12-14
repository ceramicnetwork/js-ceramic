import { jest } from '@jest/globals'
import { CID } from 'multiformats/cid'
import { create as createMultihash } from 'multiformats/hashes/digest'
import { toString } from 'uint8arrays'

import { SHA256_CODE, DAG_CBOR_CODE, createCidFromHexValue } from '../cid.js'

function createCID(digest: Uint8Array = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7])): CID {
  const multihash = createMultihash(SHA256_CODE, digest)
  return CID.create(1, DAG_CBOR_CODE, multihash)
}

describe('root CID extraction', () => {
  test('createCidFromHexValue()', () => {
    const expected = createCID()
    const hex = '0x' + toString(expected.multihash.digest, 'base16')
    const cid = createCidFromHexValue(hex)
    expect(cid.equals(expected)).toBe(true)
  })
})
