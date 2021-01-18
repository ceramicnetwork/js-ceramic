import {LocalManagedProvider} from "@glif/local-managed-provider";
import {Network} from "@glif/filecoin-address"
import {validateLink} from "../filecoin";
import {AccountID} from "caip";
import * as linking from '@ceramicnetwork/blockchain-utils-linking'

const did = 'did:3:bafysdfwefwe'
const testnetPrivateKey = '7b2254797065223a22736563703235366b31222c22507269766174654b6579223a2257587362654d5176487a366f5668344b637262633045642b31362b3150766a6a504f3753514931355031343d227d'
const mainnetPrivateKey = '7b2254797065223a22736563703235366b31222c22507269766174654b6579223a2257587362654d5176487a366f5668344b637262633045642b31362b3150766a6a554f3753514931355031343d227d'
const blsPrivateKey = "7b2254797065223a22626c73222c22507269766174654b6579223a226e586841424f4163796856504b48326155596261796f4475752f4c6f32515a2b6662622f6f736a2f34456f3d227d";
const testnetProvider = new LocalManagedProvider(testnetPrivateKey, Network.TEST)
const mainnetProvider = new LocalManagedProvider(mainnetPrivateKey, Network.MAIN)
const blsMainnetProvider = new LocalManagedProvider(blsPrivateKey, Network.MAIN)

describe('validateLink', () => {
  test('testnet', async () => {
    const addresses = await testnetProvider.getAccounts()
    const authProvider = new linking.filecoin.FilecoinAuthProvider(testnetProvider, addresses[0])
    const proof = await authProvider.createLink(did)
    await expect(validateLink(proof)).resolves.toEqual(proof)
  })

  test('mainnet', async () => {
    const addresses = await mainnetProvider.getAccounts()
    const authProvider = new linking.filecoin.FilecoinAuthProvider(mainnetProvider, addresses[0])
    const proof = await authProvider.createLink(did)
    await expect(validateLink(proof)).resolves.toEqual(proof)

    const testAddr = await testnetProvider.getAccounts()
    const testAcc = new AccountID(`${testAddr[0]}@fil:t`)
    proof.account = testAcc.toString()
    await expect(validateLink(proof)).resolves.toEqual(null)
  })

  test('mainnet BLS', async () => {
    const addresses = await blsMainnetProvider.getAccounts()
    const authProvider = new linking.filecoin.FilecoinAuthProvider(blsMainnetProvider, addresses[0])
    const proof = await authProvider.createLink(did)
    await expect(validateLink(proof)).resolves.toEqual(proof)

    const testAddr = await testnetProvider.getAccounts()
    const testAcc = new AccountID(`${testAddr[0]}@fil:t`)
    proof.account = testAcc.toString()
    await expect(validateLink(proof)).resolves.toEqual(null)
  })
})
