import { CeramicClient } from '../ceramic-http-client.js'
import {randomBytes} from "crypto";
import {Ed25519Provider} from "key-did-provider-ed25519";
import * as KeyDidResolver from 'key-did-resolver'
import { SyncOptions } from '@ceramicnetwork/common'
import { DID } from 'dids'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { jest } from '@jest/globals'
jest.setTimeout(60000)

const seed = randomBytes(32)
const provider = new Ed25519Provider(seed)
const resolver = KeyDidResolver.getResolver()
const did = new DID({provider, resolver})
export const metadata = {controllers: []}

const ReadWriteUrls = ["ceramic-dev.3boxlabs.com", "ceramic-private-dev.3boxlabs.com"]
const ReadOnlyUrls = ["gateway-dev.ceramic.network"]

const newCeramic = async (apiUrl: string) => {
    const ceramic = new CeramicClient(`https://${apiUrl}`, {syncInterval: 500})
    if (!did.authenticated) {
        await did.authenticate();
        (metadata.controllers as string[]) = [did.id]
    }
    await ceramic.setDID(did)
    return ceramic
}

const delay = async (seconds) => new Promise<void>(resolve => setTimeout(() => resolve(), seconds * 1000))

describe('update', () => {
    const firstRwUrl = ReadWriteUrls[0]
    const opts = {publish: true, anchor: true, pin: true}
    const content0 = {step: 0}
    const content1 = {step: 1}
    const content2 = {step: 2}
    let firstCeramic: CeramicClient
    let firstTile: TileDocument

    // Create and update on first node
    test(`create stream on ${firstRwUrl}`, async () => {
        firstCeramic = await newCeramic(firstRwUrl)
        firstTile = await TileDocument.create(firstCeramic, content0, metadata, opts)
    })
    test(`update stream on ${firstRwUrl}`, async () => {
        await firstTile.update(content1, undefined, opts)
        // Store the anchor request in the DB
        await delay(1)
    })

    // Test load, update, sync on subsequent node(s) then wait before testing gateway sync
    // Skip first url because it was already handled in the previous tests
    for (let idx = 1; idx < ReadWriteUrls.length; idx++) {
        const apiUrl = ReadWriteUrls[idx]
        let tile: TileDocument
        test(`load stream on ${apiUrl}`, async () => {
            const ceramic = await newCeramic(apiUrl)
            tile = await TileDocument.load(ceramic, firstTile.id)
            expect(tile.content).toEqual(content1)
        })
        test(`sync stream on ${apiUrl}`, async () => {
            // Update on first node and wait for update to propagate to other nodes via pubsub
            await firstTile.update(content2, undefined, opts)
            await delay(5)
            await tile.sync({sync: SyncOptions.NEVER_SYNC})
            expect(tile.content).toEqual(firstTile.content)
            // Wait at the end of the loop before testing gateway sync
            if (idx == ReadWriteUrls.length - 1) {
                await delay(5)
            }
        })
    }

    // Test sync on gateway(s)
    ReadOnlyUrls.forEach(apiUrl => {
        test(`sync stream on ${apiUrl}`, async () => {
            const ceramic = await newCeramic(apiUrl)
            const tile = await TileDocument.load(ceramic, firstTile.id)
            expect(tile.content).toEqual(content2)
        })
    })
})
