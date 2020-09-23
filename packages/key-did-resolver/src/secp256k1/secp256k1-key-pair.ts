import crypto from 'crypto'

import bs58 from 'bs58'
import secp256k1 from 'secp256k1'
import * as utils from './secp256k1-utils'

/**
 * Encapsulates Secp256k1 key pair
 */
export class Secp256k1KeyPair {
    public id: string
    public type: string
    public controller: string

    public publicKeyBase58: string
    public privateKeyBase58: string

    constructor(options: any = {}) {
        this.type = 'EcdsaSecp256k1VerificationKey2019'

        this.id = options.id
        this.controller = options.controller
        this.privateKeyBase58 = options.privateKeyBase58
        this.publicKeyBase58 = options.publicKeyBase58
    }

    /**
     * Constructs fingerprint from public key
     */
    static fingerprintFromPublicKey({ publicKeyBase58 }: any): string {
        const pubkeyBytes = bs58.decode(publicKeyBase58)
        const buffer = new Uint8Array(2 + pubkeyBytes.length)
        // See https://github.com/multiformats/multicodec/blob/master/table.csv
        // 0xe7 is Secp256k1 public key
        buffer[0] = 0xe7 //
        buffer[1] = 0x01
        buffer.set(pubkeyBytes, 2)
        // prefix with `z` to indicate multi-base base58btc encoding
        return `z${bs58.encode(buffer)}`
    }

    /**
     * Derive instance from options
     */
    static async from(options: any): Promise<Secp256k1KeyPair> {
        let privateKeyBase58 = options.privateKeyBase58
        let publicKeyBase58 = options.publicKeyBase58

        if (options.privateKeyHex) {
            privateKeyBase58 = await utils.privateKeyBase58FromPrivateKeyHex(options.privateKeyHex)
        }

        if (options.publicKeyHex) {
            publicKeyBase58 = await utils.publicKeyBase58FromPublicKeyHex(options.publicKeyHex)
        }

        if (options.privateKeyJwk) {
            privateKeyBase58 = utils.privateKeyBase58FromPrivateKeyHex(await utils.privateKeyHexFromJwk(options.privateKeyJwk))
        }

        if (options.publicKeyJwk) {
            publicKeyBase58 = utils.privateKeyBase58FromPrivateKeyHex(await utils.publicKeyHexFromJwk(options.publicKeyJwk))
        }

        return new Secp256k1KeyPair({
            ...options, privateKeyBase58, publicKeyBase58,
        })
    }

    /**
     * Derive instance from fingerprint
     */
    static fromFingerprint(fingerprint: any): Secp256k1KeyPair {
        // skip leading `z` that indicates base58 encoding
        const buffer = bs58.decode(fingerprint.substr(1))

        // https://github.com/multiformats/multicodec/blob/master/table.csv#L77
        if (buffer[0] === 0xe7 && buffer[1] === 0x01) {
            const publicKeyBase58 = bs58.encode(buffer.slice(2))
            const did = `did:key:${Secp256k1KeyPair.fingerprintFromPublicKey({
                publicKeyBase58,
            })}`
            const keyId = `#${Secp256k1KeyPair.fingerprintFromPublicKey({
                publicKeyBase58,
            })}`
            return new Secp256k1KeyPair({
                id: keyId, controller: did, publicKeyBase58,
            })
        }

        throw new Error(`Unsupported Fingerprint Type: ${fingerprint}`)
    }

    /**
     * Get public key
     */
    get publicKey(): string {
        return this.publicKeyBase58
    }

    /**
     * Get signer functionality
     */
    signer(): any {
        if (!this.privateKeyBase58) {
            return {
                async sign(): Promise<void> {
                    throw new Error('No private key to sign with.')
                },
            }
        }
        const privateKeyBase58 = this.privateKeyBase58
        return {
            async sign({ data }: any): Promise<string> {
                const messageHashUInt8Array = crypto
                    .createHash('sha256')
                    .update(data)
                    .digest()
                const privateKeyUInt8Array = await utils.privateKeyUInt8ArrayFromPrivateKeyBase58(privateKeyBase58)
                const sigObj: any = secp256k1.ecdsaSign(messageHashUInt8Array, privateKeyUInt8Array)

                return sigObj.signature
            },
        }
    }

    /**
     * Get fingerprint from the instance
     */
    fingerprint(): string {
        const { publicKeyBase58 } = this
        return Secp256k1KeyPair.fingerprintFromPublicKey({ publicKeyBase58 })
    }

    /**
     * To JWK
     * @param _private
     */
    toJwk(_private = false): string {
        if (_private) {
            return utils.privateKeyJwkFromPrivateKeyHex(bs58.decode(this.privateKeyBase58).toString('hex'))
        }
        return utils.publicKeyJwkFromPublicKeyHex(bs58.decode(this.publicKeyBase58).toString('hex'))
    }

}
