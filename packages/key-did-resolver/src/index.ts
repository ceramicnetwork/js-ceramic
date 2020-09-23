import type { ParsedDID, DIDResolver, DIDDocument } from 'did-resolver'

interface ResolverRegistry {
    [index: string]: DIDResolver;
}

import * as secp256k1 from './secp256k1/secp256k1-driver'

// supported drivers
const prefixToDriverMap: any = {
    zQ3s: secp256k1,
}

export default {
    getResolver: (): ResolverRegistry => ({
        'key': async (did: string, parsed: ParsedDID): Promise<DIDDocument | null> => {
            if (did.indexOf('did:key:') !== 0) {
                throw new Error('did must be of method did:key.');
            }
            const idchar: any = did.split('did:key:').pop();
            const encodedType = idchar.substring(0, 4);
            try {
                return await prefixToDriverMap[encodedType].resolve({ did });
            } catch (e) {
                throw new Error('Unknown DID Key type: ' + encodedType);
            }
        }
    })
}
