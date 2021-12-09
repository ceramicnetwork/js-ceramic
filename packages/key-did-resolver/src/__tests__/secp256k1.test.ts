import varint from "varint"
import { base58btc } from 'multiformats/bases/base58'
import * as mapper from "../secp256k1"

describe('Secp256k1 mapper', () => {

    it('successfully resolves the document from did', async () => {
        const id = "zQ3shbgnTGcgBpXPdBjDur3ATMDWhS7aPs6FRFkWR19Lb9Zwz"

	const multiformatPubKey = base58btc.decode(id);
        varint.decode(multiformatPubKey) // decode is changing param multiformatPubKey as well
        const pubKeyBytes = multiformatPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
    })

})

