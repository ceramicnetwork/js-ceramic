import Ceramic from "../ceramic";
import { Ed25519Provider } from "key-did-provider-ed25519";
import tmp from "tmp-promise";
import { DoctypeUtils, DocState, IpfsApi, AnchorStatus } from "@ceramicnetwork/common";
import * as u8a from "uint8arrays";
import { createIPFS } from './ipfs-util';
import { anchorUpdate } from '../state-management/__tests__/anchor-update';

const PUBSUB_TOPIC = "/ceramic/inmemory/test";
const SEED = u8a.fromString("6e34b2e1a9624113d81ece8a8a22e6e97f0e145c25c1d4d2d0e62753b4060c83", "base16");

const expectEqualStates = (state1: DocState, state2: DocState): void => {
    expect(DoctypeUtils.serializeState(state1)).toEqual(DoctypeUtils.serializeState(state2));
};

async function createCeramic(ipfs: IpfsApi, stateStoreDirectory: string) {
    const ceramic = await Ceramic.create(ipfs, {
        stateStoreDirectory,
        anchorOnRequest: false,
        pubsubTopic: PUBSUB_TOPIC, // necessary so Ceramic instances can talk to each other
    });
    const provider = new Ed25519Provider(SEED);
    await ceramic.setDIDProvider(provider);
    return ceramic;
}

jest.setTimeout(60000);
let ipfs1: IpfsApi;
let ipfs2: IpfsApi;

const DOCTYPE_TILE = "tile";

beforeEach(async () => {
    [ipfs1, ipfs2] = await Promise.all(
      Array.from({length: 2}).map(() => createIPFS())
    );
});

afterEach(async () => {
    await ipfs1.stop();
    await ipfs2.stop();
});

it("re-request anchors on #recoverDocuments", async () => {
    const stateStoreDirectory = await tmp.tmpName();

    // Store
    const ceramic1 = await createCeramic(ipfs1, stateStoreDirectory);
    const controller = ceramic1.context.did.id;

    const doc1 = await ceramic1.createDocument(
        DOCTYPE_TILE,
        { content: { test: 456 }, metadata: { controllers: [controller], tags: ["3id"] } },
        { anchor: true }
    );
    doc1.subscribe();
    await ceramic1.pin.add(doc1.id);
    expect(doc1.state.anchorStatus).toEqual(AnchorStatus.PENDING);
    await ceramic1.close();

    // Retrieve after being closed
    const ceramic2 = await createCeramic(ipfs2, stateStoreDirectory);

    const doc2 = await ceramic2.loadDocument(doc1.id);
    doc2.subscribe()
    expect(doc2.state.anchorStatus).toEqual(AnchorStatus.PENDING);
    // doc2 is exact replica of doc1
    expectEqualStates(doc1.state, doc2.state);
    // Now CAS anchors
    await anchorUpdate(ceramic2, doc2);
    // And the document is anchored
    expect(doc2.state.anchorStatus).toEqual(AnchorStatus.ANCHORED);
    await ceramic2.close();
});
