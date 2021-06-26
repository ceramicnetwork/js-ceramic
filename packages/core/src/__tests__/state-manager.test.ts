import { AnchorStatus, IpfsApi, SignatureStatus, StreamUtils } from '@ceramicnetwork/common';
import CID from 'cids';
import { RunningState } from '../state-management/running-state';
import { createIPFS } from './ipfs-util';
import { createCeramic } from './create-ceramic';
import Ceramic from '../ceramic';
import { anchorUpdate } from '../state-management/__tests__/anchor-update';
import { TileDocument } from '@ceramicnetwork/stream-tile';
import { streamFromState } from '../state-management/stream-from-state';
import * as uint8arrays from 'uint8arrays';
import * as sha256 from '@stablelib/sha256';
import { StreamID } from '@ceramicnetwork/streamid';
import { from, timer } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
import { MAX_RESPONSE_INTERVAL } from '../pubsub/message-bus';

const FAKE_CID = new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu');
const INITIAL_CONTENT = { abc: 123, def: 456 };
const STRING_MAP_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'StringMap',
  type: 'object',
  additionalProperties: {
    type: 'string',
  },
};

let ipfs: IpfsApi;
let ceramic: Ceramic;
let controllers: string[];

jest.setTimeout(10000);

beforeAll(async () => {
  ipfs = await createIPFS();
  ceramic = await createCeramic(ipfs, { anchorOnRequest: true });

  controllers = [ceramic.did.id];
});

afterAll(async () => {
  await ceramic.close();
  await ipfs.stop();
});

describe('anchor', () => {

  let realHandleTip;

  beforeEach(() => {
    realHandleTip = (ceramic.repository.stateManager as any)._handleTip;
  });

  afterEach(() => {
    // Restore the _handleTip function in case any of the tests modified it
    (ceramic.repository.stateManager as any)._handleTip = realHandleTip
  });

  test('anchor call', async () => {
    const stream = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false });
    const stream$ = await ceramic.repository.load(stream.id, {});

    await new Promise<void>((resolve) => {
      ceramic.repository.stateManager.anchor(stream$).add(resolve);
    });
    expect(stream$.value.anchorStatus).toEqual(AnchorStatus.ANCHORED);
  });

  test('No double anchor', async () => {
    const stream = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false });
    const stream$ = await ceramic.repository.load(stream.id, {});

    await new Promise<void>((resolve) => {
      ceramic.repository.stateManager.anchor(stream$).add(resolve);
    });
    expect(stream$.value.anchorStatus).toEqual(AnchorStatus.ANCHORED);
    expect(stream$.value.log.length).toEqual(2)

    // Now re-request an anchor when the stream is already anchored. Should be a no-op
    await new Promise<void>((resolve) => {
      ceramic.repository.stateManager.anchor(stream$).add(resolve);
    });
    expect(stream$.value.log.length).toEqual(2)
  });

  test('anchor retries successfully', async () => {
    const stateManager = ceramic.repository.stateManager;
    const stream = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false });
    const stream$ = await ceramic.repository.load(stream.id, {});

    const fakeHandleTip = jest.fn();
    (stateManager as any)._handleTip = fakeHandleTip;
    fakeHandleTip.mockRejectedValueOnce(new Error("Handle tip failed"))
    fakeHandleTip.mockRejectedValueOnce(new Error("Handle tip failed"))
    fakeHandleTip.mockImplementationOnce(realHandleTip)

    await new Promise<void>((resolve) => {
      ceramic.repository.stateManager.anchor(stream$).add(resolve);
    });
    expect(stream$.value.anchorStatus).toEqual(AnchorStatus.ANCHORED);
  });

  test('anchor too many retries', async () => {
    const stateManager = ceramic.repository.stateManager;
    const stream = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false });
    const stream$ = await ceramic.repository.load(stream.id, {});

    const fakeHandleTip = jest.fn();
    (stateManager as any)._handleTip = fakeHandleTip;
    fakeHandleTip.mockRejectedValueOnce(new Error("Handle tip failed"))
    fakeHandleTip.mockRejectedValueOnce(new Error("Handle tip failed"))
    fakeHandleTip.mockRejectedValueOnce(new Error("Handle tip failed"))
    fakeHandleTip.mockImplementationOnce(realHandleTip)

    await new Promise<void>((resolve) => {
      ceramic.repository.stateManager.anchor(stream$).add(resolve);
    });
    expect(stream$.value.anchorStatus).toEqual(AnchorStatus.FAILED);
  });
});

test('handleTip', async () => {
  const stream1 = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor:false });
  stream1.subscribe();
  const streamState1 = await ceramic.repository.load(stream1.id, {});
  await new Promise<void>((resolve) => {
    ceramic.repository.stateManager.anchor(streamState1).add(resolve);
  });


  const ceramic2 = await createCeramic(ipfs);
  const stream2 = await ceramic2.loadStream<TileDocument>(stream1.id, { syncTimeoutSeconds:0 });
  stream2.subscribe();
  const streamState2 = await ceramic2.repository.load(stream2.id, {});

  expect(stream2.content).toEqual(stream1.content);
  expect(stream2.state).toEqual(expect.objectContaining({ signature: SignatureStatus.SIGNED, anchorStatus: 0 }));

  await (ceramic2.repository.stateManager as any)._handleTip(streamState2, stream1.state.log[1].cid);

  expect(stream2.state).toEqual(stream1.state);
  await ceramic2.close();
});

test('handleTip for commit already in log', async () => {
  const newContent = {foo: 'bar'}
  const stream1 = await TileDocument.create<any>(ceramic, INITIAL_CONTENT, null, { anchor:false });
  await stream1.update(newContent, null, { anchor: false })

  const ceramic2 = await createCeramic(ipfs);
  const retrieveCommitSpy = jest.spyOn(ceramic2.dispatcher, 'retrieveCommit');

  const stream2 = await ceramic2.loadStream<TileDocument>(stream1.id, { syncTimeoutSeconds:0 });
  const streamState2 = await ceramic2.repository.load(stream2.id, {});

  retrieveCommitSpy.mockClear()
  await (ceramic2.repository.stateManager as any)._handleTip(streamState2, stream1.state.log[1].cid);

  expect(streamState2.state).toEqual(stream1.state);
  expect(retrieveCommitSpy).toBeCalledTimes(6) // TODO(1421): This should be 2!

  // Now re-apply the same commit and don't expect any additional calls to IPFS
  await (ceramic2.repository.stateManager as any)._handleTip(streamState2, stream1.state.log[1].cid);
  await (ceramic2.repository.stateManager as any)._handleTip(streamState2, stream1.state.log[0].cid);
  expect(retrieveCommitSpy).toBeCalledTimes(6)

  await ceramic2.close();
});

test('commit history and atCommit', async () => {
  const stream = await TileDocument.create<any>(ceramic, INITIAL_CONTENT);
  stream.subscribe();
  const streamState = await ceramic.repository.load(stream.id, {});

  const commit0 = stream.allCommitIds[0];
  expect(stream.commitId).toEqual(commit0);
  expect(commit0.equals(streamState.id.atCommit(streamState.id.cid))).toBeTruthy();

  await anchorUpdate(ceramic, stream);
  expect(stream.allCommitIds.length).toEqual(2);
  expect(stream.anchorCommitIds.length).toEqual(1);
  const commit1 = stream.allCommitIds[1];
  expect(commit1.equals(commit0)).toBeFalsy();
  expect(commit1).toEqual(stream.commitId);
  expect(commit1).toEqual(stream.anchorCommitIds[0]);

  const newContent = { abc: 321, def: 456, gh: 987 };
  const updateRec = await stream.makeCommit(ceramic, newContent)
  await ceramic.repository.stateManager.applyCommit(streamState.id, updateRec, { anchor: true, publish: false });
  expect(stream.allCommitIds.length).toEqual(3);
  expect(stream.anchorCommitIds.length).toEqual(1);
  const commit2 = stream.allCommitIds[2];
  expect(commit2.equals(commit1)).toBeFalsy();
  expect(commit2).toEqual(stream.commitId);

  await anchorUpdate(ceramic, stream);
  expect(stream.allCommitIds.length).toEqual(4);
  expect(stream.anchorCommitIds.length).toEqual(2);
  const commit3 = stream.allCommitIds[3];
  expect(commit3.equals(commit2)).toBeFalsy();
  expect(commit3).toEqual(stream.commitId);
  expect(commit3).toEqual(stream.anchorCommitIds[1]);
  expect(stream.content).toEqual(newContent);
  expect(stream.state.signature).toEqual(SignatureStatus.SIGNED);
  expect(stream.state.anchorStatus).not.toEqual(AnchorStatus.NOT_REQUESTED);
  expect(stream.state.log.length).toEqual(4);

  // Apply a final record that does not get anchored
  const finalContent = { foo: 'bar' };
  const updateRec2 = await stream.makeCommit(ceramic, finalContent)
  await ceramic.repository.stateManager.applyCommit(streamState.id, updateRec2, { anchor: true, publish: false });

  expect(stream.allCommitIds.length).toEqual(5);
  expect(stream.anchorCommitIds.length).toEqual(2);
  const commit4 = stream.allCommitIds[4];
  expect(commit4.equals(commit3)).toBeFalsy();
  expect(commit4).toEqual(stream.commitId);
  expect(commit4.equals(stream.anchorCommitIds[1])).toBeFalsy();
  expect(stream.state.log.length).toEqual(5);

  // Correctly check out a specific commit
  const streamV0 = await ceramic.repository.stateManager.atCommit(streamState, commit0);
  expect(streamV0.id.equals(commit0.baseID)).toBeTruthy();
  expect(streamV0.value.log.length).toEqual(1);
  expect(streamV0.value.metadata.controllers).toEqual(controllers);
  expect(streamV0.value.content).toEqual(INITIAL_CONTENT);
  expect(streamV0.value.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED);

  const streamV1 = await ceramic.repository.stateManager.atCommit(streamState, commit1);
  expect(streamV1.id.equals(commit1.baseID)).toBeTruthy();
  expect(streamV1.value.log.length).toEqual(2);
  expect(streamV1.value.metadata.controllers).toEqual(controllers);
  expect(streamV1.value.content).toEqual(INITIAL_CONTENT);
  expect(streamV1.value.anchorStatus).toEqual(AnchorStatus.ANCHORED);

  const streamV2 = await ceramic.repository.stateManager.atCommit(streamState, commit2);
  expect(streamV2.id.equals(commit2.baseID)).toBeTruthy();
  expect(streamV2.value.log.length).toEqual(3);
  expect(streamV2.value.metadata.controllers).toEqual(controllers);
  expect(streamV2.value.next.content).toEqual(newContent);
  expect(streamV2.value.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED);

  const streamV3 = await ceramic.repository.stateManager.atCommit(streamState, commit3);
  expect(streamV3.id.equals(commit3.baseID)).toBeTruthy();
  expect(streamV3.value.log.length).toEqual(4);
  expect(streamV3.value.metadata.controllers).toEqual(controllers);
  expect(streamV3.value.content).toEqual(newContent);
  expect(streamV3.value.anchorStatus).toEqual(AnchorStatus.ANCHORED);

  const streamV4 = await ceramic.repository.stateManager.atCommit(streamState, commit4);
  expect(streamV4.id.equals(commit4.baseID)).toBeTruthy();
  expect(streamV4.value.log.length).toEqual(5);
  expect(streamV4.value.metadata.controllers).toEqual(controllers);
  expect(streamV4.value.next.content).toEqual(finalContent);
  expect(streamV4.value.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED);
});

describe('atCommit', () => {
  test('non-existing commit', async () => {
    const stream = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false });
    const streamState = await ceramic.repository.load(stream.id, {});
    // Emulate loading a non-existing commit
    const nonExistentCommitID = stream.id.atCommit(FAKE_CID);
    const originalRetrieve = ceramic.dispatcher.retrieveCommit.bind(ceramic.dispatcher);
    ceramic.dispatcher.retrieveCommit = jest.fn(async (cid: CID) => {
      if (cid.equals(FAKE_CID)) {
        return null;
      } else {
        return originalRetrieve(cid);
      }
    });
    await expect(ceramic.repository.stateManager.atCommit(streamState, nonExistentCommitID)).rejects.toThrow(
      `No commit found for CID ${nonExistentCommitID.commit?.toString()}`,
    );
  });

  test('return read-only snapshot', async () => {
    const stream1 = await TileDocument.create<any>(ceramic, INITIAL_CONTENT, null, { anchor: false, syncTimeoutSeconds: 0 });
    await stream1.update({ abc: 321, def: 456, gh: 987 });
    await anchorUpdate(ceramic, stream1);

    const ceramic2 = await createCeramic(ipfs, { anchorOnRequest: false });
    const stream2 = await TileDocument.load(ceramic, stream1.id);
    const streamState2 = await ceramic2.repository.load(stream2.id, { syncTimeoutSeconds: 0 });
    const snapshot = await ceramic2.repository.stateManager.atCommit(streamState2, stream1.commitId);

    expect(StreamUtils.statesEqual(snapshot.state, stream1.state));
    const snapshotStream = streamFromState<TileDocument>(ceramic2.context, ceramic2._streamHandlers, snapshot.value);
    await expect(
      snapshotStream.update({ abc: 1010 }),
    ).rejects.toThrow(
      'Historical stream commits cannot be modified. Load the stream without specifying a commit to make updates.',
    );

    await ceramic2.close();
  });

  test('commit ahead of current state', async () => {
    const stream = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false });
    const streamState = await ceramic.repository.load(stream.id, {});
    // Provide a new commit that the repository doesn't currently know about
    const newContent = { abc: 321, def: 456, gh: 987 };
    const updateCommit = await stream.makeCommit(ceramic, newContent)
    const futureCommitCID = await ceramic.dispatcher.storeCommit(updateCommit)
     const futureCommitID = stream.id.atCommit(futureCommitCID);

    // Now load the stream at a commitID ahead of what is currently in the state in the repository.
    // The existing RunningState from the repository should also get updated
    const snapshot = await ceramic.repository.loadAtCommit(futureCommitID, {})
    expect(snapshot.value.next.content).toEqual(newContent)
    expect(snapshot.value.log.length).toEqual(2)
    expect(StreamUtils.serializeState(streamState.state)).toEqual(StreamUtils.serializeState(snapshot.value))
  });
});

test('handles basic conflict', async () => {
  const stream1 = await TileDocument.create(ceramic, INITIAL_CONTENT);
  stream1.subscribe();
  const streamState1 = await ceramic.repository.load(stream1.id, {});
  const streamId = stream1.id;
  await anchorUpdate(ceramic, stream1);
  const tipPreUpdate = stream1.tip;

  const newContent = { abc: 321, def: 456, gh: 987 };
  let updateRec = await stream1.makeCommit(ceramic, newContent)
  await ceramic.repository.stateManager.applyCommit(streamState1.id, updateRec, { anchor: true, publish: false });

  await anchorUpdate(ceramic, stream1);
  expect(stream1.content).toEqual(newContent);
  const tipValidUpdate = stream1.tip;
  // create invalid change that happened after main change

  const initialState = await ceramic.repository.stateManager
    .atCommit(streamState1, streamId.atCommit(streamId.cid))
    .then((stream) => stream.state);
  const state$ = new RunningState(initialState);
  ceramic.repository.add(state$);
  await (ceramic.repository.stateManager as any)._handleTip(state$, tipPreUpdate);
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const conflictingNewContent = { asdf: 2342 };
  const stream2 = streamFromState<TileDocument>(ceramic.context, ceramic._streamHandlers, state$.value, ceramic.repository.updates$);
  stream2.subscribe();
  updateRec = await stream2.makeCommit(ceramic, conflictingNewContent)
  await ceramic.repository.stateManager.applyCommit(state$.id, updateRec, { anchor: true, publish: false });

  await anchorUpdate(ceramic, stream2);
  const tipInvalidUpdate = state$.tip;
  expect(stream2.content).toEqual(conflictingNewContent);
  // loading tip from valid log to stream with invalid
  // log results in valid state
  await (ceramic.repository.stateManager as any)._handleTip(state$, tipValidUpdate);
  expect(stream2.content).toEqual(newContent);

  // loading tip from invalid log to stream with valid
  // log results in valid state
  await (ceramic.repository.stateManager as any)._handleTip(streamState1, tipInvalidUpdate);
  expect(stream1.content).toEqual(newContent);

  // Loading valid commit works
  const streamAtValidCommit = await ceramic.repository.stateManager.atCommit(streamState1, streamId.atCommit(tipValidUpdate));
  expect(streamAtValidCommit.value.content).toEqual(newContent);

  // Loading invalid commit fails
  await expect(ceramic.repository.stateManager.atCommit(streamState1, streamId.atCommit(tipInvalidUpdate))).rejects.toThrow(
    `Requested commit CID ${tipInvalidUpdate.toString()} not found in the log for stream ${streamId.toString()}`,
  );
}, 10000);

test('enforces schema in update that assigns schema', async () => {
  const schemaDoc = await TileDocument.create(ceramic, STRING_MAP_SCHEMA);
  await anchorUpdate(ceramic, schemaDoc);

  const stream = await TileDocument.create(ceramic, { stuff: 1 });
  const streamState = await ceramic.repository.load(stream.id, {});
  await anchorUpdate(ceramic, stream);
  const updateRec = await stream.makeCommit(ceramic, null, { schema: schemaDoc.commitId });
  await expect(ceramic.repository.stateManager.applyCommit(streamState.id, updateRec, { anchor: false })).rejects.toThrow(
    "Validation Error: data/stuff must be string",
  );
});

test('enforce previously assigned schema during future update', async () => {
  const schemaDoc = await TileDocument.create(ceramic, STRING_MAP_SCHEMA);
  await anchorUpdate(ceramic, schemaDoc);

  const conformingContent = { stuff: 'foo' };
  const nonConformingContent = { stuff: 1 };
  const stream = await TileDocument.create<any>(ceramic, conformingContent, { schema: schemaDoc.commitId });
  const streamState = await ceramic.repository.load(stream.id, {});
  await anchorUpdate(ceramic, stream);

  const updateRec = await stream.makeCommit(ceramic, nonConformingContent);
  await expect(ceramic.repository.stateManager.applyCommit(streamState.id, updateRec, { anchor: false, publish: false })).rejects.toThrow(
    "Validation Error: data/stuff must be string",
  );
});

test('should announce change to network', async () => {
  const publishTip = jest.spyOn(ceramic.dispatcher, 'publishTip');
  const stream1 = await TileDocument.create<any>(ceramic, INITIAL_CONTENT, null, { anchor: false });
  stream1.subscribe();
  const streamState1 = await ceramic.repository.load(stream1.id, {});
  expect(publishTip).toHaveBeenCalledTimes(1);
  expect(publishTip).toHaveBeenCalledWith(stream1.id, stream1.tip);
  await publishTip.mockClear();

  const updateRec = await stream1.makeCommit(ceramic, { foo: 34 });
  await ceramic.repository.stateManager.applyCommit(streamState1.id, updateRec, { anchor: false, publish: true });
  expect(publishTip).toHaveBeenCalledWith(stream1.id, stream1.tip);
});

describe('sync', () => {
  let originalCeramic: Ceramic;

  beforeEach(() => {
    originalCeramic = ceramic;
  });

  afterEach(() => {
    ceramic = originalCeramic;
  });

  const FAKE_STREAM_ID = StreamID.fromString('kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s');
  function digest(input: string) {
    return uint8arrays.toString(sha256.hash(uint8arrays.fromString(input)), 'base16');
  }
  function hash(data: string): CID {
    return new CID(1, 'sha2-256', Buffer.from('1220' + digest(data), 'hex'));
  }

  function responseTips(amount: number) {
    const times = Array.from({ length: amount }).map((_, index) => index);
    return times.map((n) => hash(n.toString()));
  }

  test('handle first received', async () => {
    const stateManager = ceramic.repository.stateManager;
    const response = responseTips(1);
    ceramic.dispatcher.messageBus.queryNetwork = () => from(response);
    const fakeHandleTip = jest.fn(() => Promise.resolve());
    (stateManager as any)._handleTip = fakeHandleTip;
    const state$ = ({ id: FAKE_STREAM_ID } as unknown) as RunningState;
    await stateManager.sync(state$, 1000, false);
    expect(fakeHandleTip).toHaveBeenCalledWith(state$, response[0]);
  });
  test('handle all received', async () => {
    const stateManager = ceramic.repository.stateManager;
    const amount = 10;
    const response = responseTips(amount);
    ceramic.dispatcher.messageBus.queryNetwork = () => from(response);
    const fakeHandleTip = jest.fn(() => Promise.resolve());
    (stateManager as any)._handleTip = fakeHandleTip;
    const state$ = ({ id: FAKE_STREAM_ID } as unknown) as RunningState;
    await stateManager.sync(state$, 1000, false);
    response.forEach((r) => {
      expect(fakeHandleTip).toHaveBeenCalledWith(state$, r);
    });
  });
  test('not handle delayed', async () => {
    const stateManager = ceramic.repository.stateManager;
    const amount = 10;
    const response = responseTips(amount);
    ceramic.dispatcher.messageBus.queryNetwork = () =>
      from(response).pipe(
        concatMap(async (value, index) => {
          await new Promise((resolve) => setTimeout(resolve, index * MAX_RESPONSE_INTERVAL * 0.3));
          return value;
        }),
      );
    const fakeHandleTip = jest.fn(() => Promise.resolve());
    (stateManager as any)._handleTip = fakeHandleTip;
    const state$ = ({ id: FAKE_STREAM_ID } as unknown) as RunningState;
    await stateManager.sync(state$, 1000, false);
    expect(fakeHandleTip).toBeCalledTimes(5)
    response.slice(0, 5).forEach((r) => {
      expect(fakeHandleTip).toHaveBeenCalledWith(state$, r);
    });
    response.slice(6, 10).forEach((r) => {
      expect(fakeHandleTip).not.toHaveBeenCalledWith(state$, r);
    });
  });
  test('stop after timeout', async () => {
    const stateManager = ceramic.repository.stateManager;
    ceramic.dispatcher.messageBus.queryNetwork = () => timer(0, MAX_RESPONSE_INTERVAL * 0.5).pipe(map(n => hash(n.toString())))
    const fakeHandleTip = jest.fn(() => Promise.resolve());
    (stateManager as any)._handleTip = fakeHandleTip;
    const state$ = ({ id: FAKE_STREAM_ID } as unknown) as RunningState;
    await stateManager.sync(state$, MAX_RESPONSE_INTERVAL * 10, false);
    expect(fakeHandleTip).toBeCalledTimes(20)
  });
});
