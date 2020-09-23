import * as u8a from 'uint8arrays'

/**
 * Constructs the document based on the method key
 */
const keyToDidDoc = (pubKeyBytes: Uint8Array, fingerprint: string): any => {
    const did = `did:key:${fingerprint}`
    const keyId = `${did}#${fingerprint}`
    return {
        "@context": "https://w3id.org/did/v1",
        id: did,
        publicKey: [{
            id: keyId,
            type: 'Secp256k1VerificationKey2018',
            controller: did,
            publicKeyHex: u8a.toString(pubKeyBytes, "base16"),
        },],
        authentication: [keyId],
        assertionMethod: [keyId],
        capabilityDelegation: [keyId],
        capabilityInvocation: [keyId],
    }
}

export {
    keyToDidDoc
}
