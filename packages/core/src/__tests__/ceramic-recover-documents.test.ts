import IPFS from "ipfs-core";
import Ceramic from "../ceramic";
import { Ed25519Provider } from "key-did-provider-ed25519";
import tmp from "tmp-promise";
import getPort from "get-port";
import { DoctypeUtils, DocState, Doctype, IpfsApi, AnchorStatus } from "@ceramicnetwork/common";

import dagJose from "dag-jose";
import basicsImport from "multiformats/cjs/src/basics-import.js";
import legacy from "multiformats/cjs/src/legacy.js";
import * as u8a from "uint8arrays";

const PUBSUB_TOPIC = "/ceramic/inmemory/test";
const SEED = u8a.fromString("6e34b2e1a9624113d81ece8a8a22e6e97f0e145c25c1d4d2d0e62753b4060c83", "base16");

/**
 * Create an IPFS instance
 * @param overrideConfig - IPFS config for override
 */
const createIPFS = (overrideConfig: Record<string, unknown> = {}): Promise<any> => {
  basicsImport.multicodec.add(dagJose);
  const format = legacy(basicsImport, dagJose.name);

  const config = {
    ipld: { formats: [format] },
  };

  Object.assign(config, overrideConfig);
  return IPFS.create(config);
};

const expectEqualStates = (state1: DocState, state2: DocState): void => {
  expect(DoctypeUtils.serializeState(state1)).toEqual(DoctypeUtils.serializeState(state2));
};

const anchor = async (ceramic: Ceramic): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await ceramic.context.anchorService.anchor();
};

const syncDoc = async (doctype: Doctype): Promise<void> => {
  await new Promise<void>((resolve) => {
    doctype.on("change", () => {
      resolve();
    });
  });
};

async function createCeramic(ipfs: IpfsApi, pinsetDirectory: string) {
  const ceramic = await Ceramic.create(ipfs, {
    pinsetDirectory: pinsetDirectory,
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
let ipfs3: IpfsApi;
let multaddr1: string;
let multaddr2: string;
let multaddr3: string;
let tmpFolder: any;

const DOCTYPE_TILE = "tile";

let p1Start = 4000;
let p2Start = 4100;
let p3Start = 4200;

const pOffset = 100;

let port1: number;
let port2: number;
let port3: number;

beforeEach(async () => {
  tmpFolder = await tmp.dir({ unsafeCleanup: true });

  const buildConfig = (path: string, port: number): Record<string, unknown> => {
    return {
      repo: `${path}/ipfs${port}/`,
      config: {
        Addresses: { Swarm: [`/ip4/127.0.0.1/tcp/${port}`] },
        Bootstrap: [],
      },
    };
  };

  const findPort = async (start: number, offset: number): Promise<number> => {
    return await getPort({ port: getPort.makeRange(start + 1, start + offset) });
  };

  [port1, port2, port3] = await Promise.all([p1Start, p2Start, p3Start].map((start) => findPort(start, pOffset)));
  [ipfs1, ipfs2, ipfs3] = await Promise.all(
    [port1, port2, port3].map((port) => createIPFS(buildConfig(tmpFolder.path, port)))
  );
  [p1Start, p2Start, p3Start] = [p1Start, p2Start, p3Start].map((start) => start + pOffset);

  multaddr1 = (await ipfs1.id()).addresses[0].toString();
  multaddr2 = (await ipfs2.id()).addresses[0].toString();
  multaddr3 = (await ipfs3.id()).addresses[0].toString();

  const id1 = await ipfs1.id();
  const id2 = await ipfs2.id();
  const id3 = await ipfs3.id();
  multaddr1 = id1.addresses[0].toString();
  multaddr2 = id2.addresses[0].toString();
  multaddr3 = id3.addresses[0].toString();
});

afterEach(async () => {
  await ipfs1.stop(() => console.log("IPFS1 stopped"));
  await ipfs2.stop(() => console.log("IPFS2 stopped"));
  await ipfs3.stop(() => console.log("IPFS3 stopped"));

  await tmpFolder.cleanup();
});

it("re-request anchors on #recoverDocuments", async () => {
  const pinsetDirectory = await tmp.tmpName();

  // Store
  const ceramic1 = await createCeramic(ipfs1, pinsetDirectory);
  const controller = ceramic1.context.did.id;

  const doc1 = await ceramic1.createDocument(
    DOCTYPE_TILE,
    { content: { test: 456 }, metadata: { controllers: [controller], tags: ["3id"] } },
    { anchor: true }
  );
  await ceramic1.pin.add(doc1.id);
  expect(doc1.state.anchorStatus).toEqual(AnchorStatus.PENDING);
  await ceramic1.close();

  // Retrieve after being closed
  const ceramic2 = await createCeramic(ipfs2, pinsetDirectory);
  // Start asking CAS for updates on existing PENDING or PROCESSING documents
  await ceramic2.recoverDocuments();

  const doc2 = await ceramic2.loadDocument(doc1.id);
  expect(doc2.state.anchorStatus).toEqual(AnchorStatus.PENDING);
  // doc2 is exact replica of doc1
  expectEqualStates(doc1.state, doc2.state);
  // Now CAS anchors
  await anchor(ceramic2);
  await syncDoc(doc2);
  // And the document is anchored
  expect(doc2.state.anchorStatus).toEqual(AnchorStatus.ANCHORED);
  await ceramic2.close();
});
