import { Secp256k1KeyPair } from "../secp256k1-key-pair"
import * as driver from "../secp256k1-driver"

describe('Secp256k1 driver', () => {

    it('successfully creates Secp256k1KeyPair instance from fingerprint', async () => {
        const keyPair = Secp256k1KeyPair.fromFingerprint("zQ3shwsCgFanBax6UiaLu1oGvM7vhuqoW88VBUiUTCeHbTeTV")
        expect(keyPair).toMatchSnapshot()
    })

    it('successfully resolves the document from did', async () => {
        const document = await driver.resolve({ did: "did:key:zQ3shwsCgFanBax6UiaLu1oGvM7vhuqoW88VBUiUTCeHbTeTV" })
        expect(document).toMatchSnapshot()
    })

})

