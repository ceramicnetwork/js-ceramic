import varint from 'varint'
import multibase from 'multibase'
import * as mapper from '../ed25519'

describe('Ed25519 mapper', () => {
  it('successfully resolves the document from did', async () => {
    const id = 'z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8'

    const multicodecPubKey = multibase.decode(id)
    varint.decode(multicodecPubKey) // decode is changing param multicodecPubKey as well
    const pubKeyBytes = multicodecPubKey.slice(varint.decode.bytes)
    const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
    expect(doc).toMatchSnapshot()
  })
})
