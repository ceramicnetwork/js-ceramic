import tmp from 'tmp-promise';
import {
  AnchorStatus,
  CommitType,
  StreamState,
  IpfsApi,
  SignatureStatus,
} from '@ceramicnetwork/common';
import { TileDocument } from "@ceramicnetwork/stream-tile";
import { PinStore } from '../pin-store';
import { PinStoreFactory } from '../pin-store-factory';
import StreamID from '@ceramicnetwork/streamid';
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

  const streamId = new StreamID('tile', FAKE_CID);
  const streamState: StreamState = {
    type: 0,
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

  it('pins stream correctly without IPFS pinning', async () => {
    await expect(store.stateStore.load(streamId)).resolves.toBeNull();
    const pinSpy = jest.spyOn(store.pinning, 'pin');
    await store.stateStore.save({ id: streamId, state: streamState });
    expect(pinSpy).toBeCalledTimes(0);
    await expect(store.stateStore.load(streamId)).resolves.toEqual(streamState);
  });

  it('pins not anchored stream correctly with IPFS pinning', async () => {
    const state: StreamState = {
      ...streamState,
      log: [{ cid: FAKE_CID, type: CommitType.GENESIS }],
    };
    await expect(store.stateStore.load(streamId)).resolves.toBeNull();
    const pinSpy = jest.spyOn(store.pinning, 'pin');
    await store.add({ id: streamId, state: state });
    expect(pinSpy).toBeCalledWith(FAKE_CID);
    expect(pinSpy).toBeCalledTimes(1);
    await expect(store.stateStore.load(streamId)).resolves.toEqual(state);
  });

  it('adds and removes pinned stream', async () => {
    const realIpfs = await createIPFS();
    const ceramic = await createCeramic(realIpfs);

    const stream = await TileDocument.create(ceramic, { stuff: 1 });
    await anchorUpdate(ceramic, stream);

    const pinSpy = jest.spyOn(realIpfs.pin, 'add');
    await ceramic.pin.add(stream.id);
    expect(pinSpy).toBeCalledTimes(5);

    const unpinSpy = jest.spyOn(realIpfs.pin, 'rm');
    await ceramic.pin.rm(stream.id);
    expect(unpinSpy).toBeCalledTimes(5);

    await ceramic.close();
    await realIpfs.stop();
  }, 20000);

  it('skips removing unpinned stream', async () => {
    await expect(store.stateStore.load(streamId)).resolves.toBeNull();
    const unpinSpy = jest.spyOn(store.pinning, 'unpin');
    await store.rm(streamId);
    expect(unpinSpy).toBeCalledTimes(0);
  });

  test('list pinned streams', async () => {
    const realIpfs = await createIPFS();
    const ceramic = await createCeramic(realIpfs);

    const stream1 = await TileDocument.create(ceramic, { stuff: 1 }, null, { anchor: false, publish: false });
    await ceramic.pin.add(stream1.id);

    const stream2 = await TileDocument.create(ceramic, { stuff: 2 }, null, { anchor: false, publish: false });
    await ceramic.pin.add(stream2.id);

    const pinned = [];
    const iterator = await ceramic.pin.ls();
    for await (const id of iterator) {
      pinned.push(id);
    }

    expect(pinned.includes(stream1.id.toString())).toBeTruthy();
    expect(pinned.includes(stream2.id.toString())).toBeTruthy();

    const pinnedSingle = [];
    for await (const id of await ceramic.pin.ls(new StreamID('tile', FAKE_CID))) {
      pinned.push(id);
    }

    expect(pinnedSingle).toEqual([]);

    await ceramic.close();
    await realIpfs.stop();
  }, 10000);

  it('pins in different networks', async () => {
    const levelPath = (await tmp.dir({ unsafeCleanup: true })).path;
    const storeFactoryLocal = new PinStoreFactory(ipfs, {
      stateStoreDirectory: levelPath,
      pinningEndpoints: ['ipfs+context'],
      networkName: 'local',
    });
    const localStore = storeFactoryLocal.createPinStore();

    await localStore.stateStore.save({ id: streamId, state: streamState });
    await expect(localStore.stateStore.load(streamId)).resolves.toEqual(streamState);

    await localStore.close();

    // Now create a net pin store for a different ceramic network
    const storeFactoryInMemory = new PinStoreFactory(ipfs, {
      stateStoreDirectory: levelPath,
      pinningEndpoints: ['ipfs+context'],
      networkName: 'inmemory',
    });
    const inMemoryStore = storeFactoryInMemory.createPinStore();

    // The new pin store shouldn't be able to see streams that were pinned on the other network
    await expect(inMemoryStore.stateStore.load(streamId)).resolves.toBeNull();
  });
});
