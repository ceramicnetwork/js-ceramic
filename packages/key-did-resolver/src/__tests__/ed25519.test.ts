import varint from "varint"
import { base58btc } from 'multiformats/bases/base58'
import * as mapper from "../ed25519"

describe('Ed25519 mapper', () => {

    it('successfully resolves the document from did', async () => {
        const id = 'z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8'

	const multiformatPubKey = base58btc.decode(id);
        varint.decode(multiformatPubKey) // decode is changing param multiformatPubKey as well
        const pubKeyBytes = multiformatPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
    })

})

