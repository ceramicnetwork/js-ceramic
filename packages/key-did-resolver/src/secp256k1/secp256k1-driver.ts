import { Secp256k1KeyPair } from "./secp256k1-key-pair"

/**
 * Constructs the document based on the method key
 */
const keyToDidDoc = (fingerprint: string): any => {
    const secp256k1KeyPair = Secp256k1KeyPair.fromFingerprint(fingerprint)
    const did = `did:key:${secp256k1KeyPair.fingerprint()}`
    const keyId = `#${secp256k1KeyPair.fingerprint()}`
    return {
        '@context': ['https://www.w3.org/ns/did/v1', {
            '@base': did,
        },],
        id: did,
        publicKey: [{
            id: keyId,
            type: secp256k1KeyPair.type,
            controller: did,
            publicKeyBase58: secp256k1KeyPair.publicKeyBase58,
        },],
        authentication: [keyId],
        assertionMethod: [keyId],
        capabilityDelegation: [keyId],
        capabilityInvocation: [keyId],
    }
}

/**
 * Resolves single DID
 */
const resolve = async ({ did }: any = {}): Promise<object> => {
    if (!did) {
        throw new TypeError('"did" must be a string.');
    }
    const fingerprint = did
        .split('#')[0]
        .split('did:key:')
        .pop();
    return keyToDidDoc(fingerprint);
}

export {
    keyToDidDoc, resolve
}
