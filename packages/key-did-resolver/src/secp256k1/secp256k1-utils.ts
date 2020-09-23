import keyto from '@trust/keyto'
import base64url from 'base64url'
import crypto from 'crypto'
import bs58 from 'bs58'
import secp256k1 from 'secp256k1'

import canonicalize from 'canonicalize'

const compressedHexEncodedPublicKeyLength = 66

/** Secp256k1 Private Key  */
// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface ISecp256k1PrivateKeyJwk {
    /** key type */
    kty: string;

    /** curve */
    crv: string;

    /** private point */
    d: string;

    /** public point */
    x: string;

    /** public point */
    y: string;

    /** key id */
    kid: string;
}

/** Secp256k1 Public Key  */
// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface ISecp256k1PublicKeyJwk {
    /** key type */
    kty: string;

    /** curve */
    crv: string;

    /** public point */
    x: string;

    /** public point */
    y: string;

    /** key id */
    kid: string;
}

/**
 * Example
 * ```js
 * {
 *  kty: 'EC',
 *  crv: 'secp256k1',
 *  d: 'rhYFsBPF9q3-uZThy7B3c4LDF_8wnozFUAEm5LLC4Zw',
 *  x: 'dWCvM4fTdeM0KmloF57zxtBPXTOythHPMm1HCLrdd3A',
 *  y: '36uMVGM7hnw-N6GnjFcihWE3SkrhMLzzLCdPMXPEXlA',
 *  kid: 'JUvpllMEYUZ2joO59UNui_XYDqxVqiFLLAJ8klWuPBw'
 * }
 * ```
 * See [rfc7638](https://tools.ietf.org/html/rfc7638) for more details on Jwk.
 */
export const getKid = (jwk: ISecp256k1PrivateKeyJwk | ISecp256k1PublicKeyJwk): string => {
    const copy = { ...jwk } as any
    delete copy.d
    delete copy.kid
    delete copy.alg
    const digest = crypto
        .createHash('sha256')
        .update(canonicalize(copy))
        .digest()

    return base64url.encode(Buffer.from(digest))
}

/** convert compressed hex encoded private key to jwk */
export const privateKeyJwkFromPrivateKeyHex = (privateKeyHex: string): any => {
    const jwk = {
        ...keyto.from(privateKeyHex, 'blk').toJwk('private'), crv: 'secp256k1',
    }
    const kid = getKid(jwk)
    return {
        ...jwk, kid,
    }
}

/** convert compressed hex encoded public key to jwk */
export const publicKeyJwkFromPublicKeyHex = (publicKeyHex: string): any => {
    let key = publicKeyHex
    if (publicKeyHex.length === compressedHexEncodedPublicKeyLength) {
        const keyBin = secp256k1.publicKeyConvert(Buffer.from(publicKeyHex, 'hex'), false)
        key = Buffer.from(keyBin).toString('hex')
    }
    const jwk = {
        ...keyto.from(key, 'blk').toJwk('public'), crv: 'secp256k1',
    }
    const kid = getKid(jwk)

    return {
        ...jwk, kid,
    }
}

/** convert jwk to hex encoded private key */
export const privateKeyHexFromJwk = async (jwk: ISecp256k1PrivateKeyJwk): Promise<string> => keyto
    .from({
        ...jwk, crv: 'K-256',
    }, 'jwk')
    .toString('blk', 'private')

/** convert jwk to hex encoded public key */
export const publicKeyHexFromJwk = async (jwk: ISecp256k1PublicKeyJwk): Promise<string> => {
    const uncompressedPublicKey = keyto
        .from({
            ...jwk, crv: 'K-256',
        }, 'jwk')
        .toString('blk', 'public')

    const compressed = secp256k1.publicKeyConvert(Buffer.from(uncompressedPublicKey, 'hex'), true)
    return Buffer.from(compressed).toString('hex')
}

/** convert publicKeyHex to base58 */
export const publicKeyBase58FromPublicKeyHex = (publicKeyHex: string) => {
    return bs58.encode(Buffer.from(publicKeyHex, 'hex'))
}

/** convert publicKeyHex to base58 */
export const privateKeyBase58FromPrivateKeyHex = (privateKeyHex: string) => {
    return bs58.encode(Buffer.from(privateKeyHex, 'hex'))
}

export const privateKeyUInt8ArrayFromPrivateKeyBase58 = async (privateKeyBase58: string) => {
    return bs58.decode(privateKeyBase58)
}
