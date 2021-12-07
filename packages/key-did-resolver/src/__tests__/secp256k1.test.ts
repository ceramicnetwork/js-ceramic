import varint from 'varint'
import { base58btc } from 'multiformats/bases/base58'
import * as mapper from '../secp256k1'

describe('Secp256k1 mapper', () => {
  it('successfully resolves the document from did', async () => {
    const id = 'zQ3shbgnTGcgBpXPdBjDur3ATMDWhS7aPs6FRFkWR19Lb9Zwz'

    const multicodecPubKey = base58btc.decode(id)
    varint.decode(multicodecPubKey) // decode is changing param multicodecPubKey as well
    const pubKeyBytes = multicodecPubKey.slice(varint.decode.bytes)
    const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
    expect(doc).toMatchSnapshot()
  })
})
