import varint from 'varint'
import { base58btc } from 'multiformats/bases/base58'
import * as mapper from '../ed25519.js'

describe('Ed25519 mapper', () => {
  it('successfully resolves the document from did', async () => {
    const id = 'z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8'

    const multicodecPubKey = base58btc.decode(id)
    varint.decode(multicodecPubKey) // decode is changing param multicodecPubKey as well
    const pubKeyBytes = multicodecPubKey.slice(varint.decode.bytes)
    const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
    expect(doc).toMatchSnapshot()
  })
})
