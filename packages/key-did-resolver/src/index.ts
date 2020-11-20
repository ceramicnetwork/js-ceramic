import varint from 'varint'
import multibase from 'multibase'
import type { ParsedDID, DIDResolver, DIDDocument } from 'did-resolver'

interface ResolverRegistry {
    [index: string]: DIDResolver;
}

import * as secp256k1 from './secp256k1'

// supported drivers
const prefixToDriverMap: any = {
    0xE7: secp256k1,
}

export default {
    getResolver: (): ResolverRegistry => ({
        'key': async (did: string, parsed: ParsedDID): Promise<DIDDocument | null> => {
            if (parsed.method !== 'key') {
                throw new Error('did must be of method did:key.')
            }
            const multicodecPubKey = multibase.decode(parsed.id)
            // @ts-ignore
            const keyType = varint.decode(multicodecPubKey)
            const pubKeyBytes = multicodecPubKey.slice(varint.decode.bytes)
            try {
                return await prefixToDriverMap[keyType].keyToDidDoc(pubKeyBytes, parsed.id)
            } catch (e) {
                throw new Error('Unknown DID Key type: ' + keyType)
            }
        }
    })
}
