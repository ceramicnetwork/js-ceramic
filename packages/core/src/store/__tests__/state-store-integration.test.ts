import tmp from 'tmp-promise';
import {
  AnchorStatus,
  CommitType,
  DocState,
  IpfsApi,
  SignatureStatus,
} from '@ceramicnetwork/common';
import { PinStore } from '../pin-store';
import { PinStoreFactory } from '../pin-store-factory';
import DocID from '@ceramicnetwork/docid';
import CID from 'cids';
import { createIPFS } from '../../__tests__/ipfs-util';
import { createCeramic } from '../../__tests__/create-ceramic';
import { anchorUpdate } from '../../state-management/__tests__/anchor-update';

const FAKE_CID = new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu');

const ipfs = ({
  dag: {
    get: jest.fn(),
  },
  pin: {
    add: jest.fn(),
  },
} as unknown) as IpfsApi;

describe('Level data store', () => {
  let store: PinStore;

  const docId = new DocID('tile', FAKE_CID);
  const docState: DocState = {
    doctype: 'tile',
    content: {},
    metadata: { controllers: ['foo'] },
    signature: SignatureStatus.GENESIS,
    anchorStatus: AnchorStatus.NOT_REQUESTED,
    log: [{ cid: FAKE_CID, type: CommitType.GENESIS }],
  };

  beforeEach(async () => {
    const levelPath = (await tmp.dir({ unsafeCleanup: true })).path;
    const storeFactory = new PinStoreFactory(ipfs, {
      stateStoreDirectory: levelPath,
      pinningEndpoints: ['ipfs+context'],
      networkName: 'inmemory',
    });
    store = storeFactory.createPinStore();
  });

  it('pins document correctly without IPFS pinning', async () => {
    await expect(store.stateStore.load(docId)).resolves.toBeNull();
    const pinSpy = jest.spyOn(store.pinning, 'pin');
    await store.stateStore.save({ id: docId, state: docState });
    expect(pinSpy).toBeCalledTimes(0);
    await expect(store.stateStore.load(docId)).resolves.toEqual(docState);
  });

  it('pins not anchored document correctly with IPFS pinning', async () => {
    const state: DocState = {
      ...docState,
      log: [{ cid: FAKE_CID, type: CommitType.GENESIS }],
    };
    await expect(store.stateStore.load(docId)).resolves.toBeNull();
    const pinSpy = jest.spyOn(store.pinning, 'pin');
    await store.add({ id: docId, state: state });
    expect(pinSpy).toBeCalledWith(FAKE_CID);
    expect(pinSpy).toBeCalledTimes(1);
    await expect(store.stateStore.load(docId)).resolves.toEqual(state);
  });

  it('adds and removes pinned document', async () => {
    const realIpfs = await createIPFS();
    const ceramic = await createCeramic(realIpfs);
    const controllers = [ceramic.did.id];

    const doc = await ceramic.createDocument('tile', {
      content: { stuff: 1 },
      metadata: { controllers, tags: ['3id'] },
    });
    await anchorUpdate(ceramic, doc);

    const pinSpy = jest.spyOn(realIpfs.pin, 'add');
    await ceramic.pin.add(doc.id);
    expect(pinSpy).toBeCalledTimes(4);

    const unpinSpy = jest.spyOn(realIpfs.pin, 'rm');
    await ceramic.pin.rm(doc.id);
    expect(unpinSpy).toBeCalledTimes(4);

    await ceramic.close();
    await realIpfs.stop();
  });

  it('skips removing unpinned document', async () => {
    await expect(store.stateStore.load(docId)).resolves.toBeNull();
    const unpinSpy = jest.spyOn(store.pinning, 'unpin');
    await store.rm(docId);
    expect(unpinSpy).toBeCalledTimes(0);
  });

  test('list pinned documents', async () => {
    const realIpfs = await createIPFS();
    const ceramic = await createCeramic(realIpfs);
    const controllers = [ceramic.did.id];

    const doc1 = await ceramic.createDocument('tile', {
      content: { stuff: 1 },
      metadata: { controllers },
    });
    await ceramic.pin.add(doc1.id);

    const doc2 = await ceramic.createDocument('tile', {
      content: { stuff: 2 },
      metadata: { controllers },
    });
    await ceramic.pin.add(doc2.id);

    const pinned = [];
    const iterator = await ceramic.pin.ls();
    for await (const id of iterator) {
      pinned.push(id);
    }

    expect(pinned.includes(doc1.id.toString())).toBeTruthy();
    expect(pinned.includes(doc2.id.toString())).toBeTruthy();

    const pinnedSingle = [];
    for await (const id of await ceramic.pin.ls(new DocID('tile', FAKE_CID))) {
      pinned.push(id);
    }

    expect(pinnedSingle).toEqual([]);

    await ceramic.close();
    await realIpfs.stop();
  });

  it('pins in different networks', async () => {
    const levelPath = (await tmp.dir({ unsafeCleanup: true })).path;
    const storeFactoryLocal = new PinStoreFactory(ipfs, {
      stateStoreDirectory: levelPath,
      pinningEndpoints: ['ipfs+context'],
      networkName: 'local',
    });
    const localStore = storeFactoryLocal.createPinStore();

    await localStore.stateStore.save({ id: docId, state: docState });
    await expect(localStore.stateStore.load(docId)).resolves.toEqual(docState);

    await localStore.close();

    // Now create a net pin store for a different ceramic network
    const storeFactoryInMemory = new PinStoreFactory(ipfs, {
      stateStoreDirectory: levelPath,
      pinningEndpoints: ['ipfs+context'],
      networkName: 'inmemory',
    });
    const inMemoryStore = storeFactoryInMemory.createPinStore();

    // The new pin store shouldn't be able to see docs that were pinned on the other network
    await expect(inMemoryStore.stateStore.load(docId)).resolves.toBeNull();
  });
});
