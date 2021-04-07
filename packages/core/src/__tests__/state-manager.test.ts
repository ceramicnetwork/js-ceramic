import { AnchorStatus, DoctypeUtils, IpfsApi, SignatureStatus } from '@ceramicnetwork/common';
import CID from 'cids';
import { RunningState } from '../state-management/running-state';
import { createIPFS } from './ipfs-util';
import { createCeramic } from './create-ceramic';
import Ceramic from '../ceramic';
import { anchorUpdate } from '../state-management/__tests__/anchor-update';
import { TileDoctype } from '@ceramicnetwork/doctype-tile';
import { doctypeFromState } from '../state-management/doctype-from-state';

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
  test('anchor call', async () => {
    const doc = await TileDoctype.create(ceramic, INITIAL_CONTENT);
    const doc$ = await ceramic.repository.load(doc.id);
    await new Promise((resolve) => {
      ceramic.repository.stateManager.anchor(doc$).add(resolve);
    });
    expect(doc$.value.anchorStatus).toEqual(AnchorStatus.ANCHORED);
  });
});

test('handleTip', async () => {
  const doc1 = await TileDoctype.create(ceramic, INITIAL_CONTENT);
  doc1.subscribe();
  const docState1 = await ceramic.repository.load(doc1.id);
  await new Promise((resolve) => {
    ceramic.repository.stateManager.anchor(docState1).add(resolve);
  });

  const ceramic2 = await createCeramic(ipfs);
  const doc2 = await ceramic2.loadDocument(doc1.id, { sync: false });
  doc2.subscribe();
  const docState2 = await ceramic2.repository.load(doc2.id);

  expect(doc2.content).toEqual(doc1.content);
  expect(doc2.state).toEqual(expect.objectContaining({ signature: SignatureStatus.SIGNED, anchorStatus: 0 }));

  await ceramic2.repository.stateManager.handleTip(docState2, doc1.state.log[1].cid);

  expect(doc2.state).toEqual(doc1.state);
  await ceramic2.close();
});

test('commit history and rewind', async () => {
  const doc = await TileDoctype.create(ceramic, INITIAL_CONTENT);
  doc.subscribe();
  const docState = await ceramic.repository.load(doc.id);

  const commit0 = doc.allCommitIds[0];
  expect(doc.commitId).toEqual(commit0);
  expect(commit0.equals(docState.id.atCommit(docState.id.cid))).toBeTruthy();
  expect(doc.anchorCommitIds.length).toEqual(0);

  await anchorUpdate(ceramic, doc);
  expect(doc.allCommitIds.length).toEqual(2);
  expect(doc.anchorCommitIds.length).toEqual(1);
  const commit1 = doc.allCommitIds[1];
  expect(commit1.equals(commit0)).toBeFalsy();
  expect(commit1).toEqual(doc.commitId);
  expect(commit1).toEqual(doc.anchorCommitIds[0]);

  const newContent = { abc: 321, def: 456, gh: 987 };
  const updateRec = await doc._makeCommit(ceramic.did, newContent)
  await ceramic.repository.stateManager.applyCommit(docState, updateRec);
  expect(doc.allCommitIds.length).toEqual(3);
  expect(doc.anchorCommitIds.length).toEqual(1);
  const commit2 = doc.allCommitIds[2];
  expect(commit2.equals(commit1)).toBeFalsy();
  expect(commit2).toEqual(doc.commitId);

  await anchorUpdate(ceramic, doc);
  expect(doc.allCommitIds.length).toEqual(4);
  expect(doc.anchorCommitIds.length).toEqual(2);
  const commit3 = doc.allCommitIds[3];
  expect(commit3.equals(commit2)).toBeFalsy();
  expect(commit3).toEqual(doc.commitId);
  expect(commit3).toEqual(doc.anchorCommitIds[1]);
  expect(doc.content).toEqual(newContent);
  expect(doc.state.signature).toEqual(SignatureStatus.SIGNED);
  expect(doc.state.anchorStatus).not.toEqual(AnchorStatus.NOT_REQUESTED);
  expect(doc.state.log.length).toEqual(4);

  // Apply a final record that does not get anchored
  const finalContent = { foo: 'bar' };
  const updateRec2 = await doc._makeCommit(ceramic.did, finalContent)
  await ceramic.repository.stateManager.applyCommit(docState, updateRec2);

  expect(doc.allCommitIds.length).toEqual(5);
  expect(doc.anchorCommitIds.length).toEqual(2);
  const commit4 = doc.allCommitIds[4];
  expect(commit4.equals(commit3)).toBeFalsy();
  expect(commit4).toEqual(doc.commitId);
  expect(commit4.equals(doc.anchorCommitIds[1])).toBeFalsy();
  expect(doc.state.log.length).toEqual(5);

  // Correctly check out a specific commit
  const docV0 = await ceramic.repository.stateManager.rewind(docState, commit0);
  expect(docV0.id.equals(commit0.baseID)).toBeTruthy();
  expect(docV0.value.log.length).toEqual(1);
  expect(docV0.value.metadata.controllers).toEqual(controllers);
  expect(docV0.value.content).toEqual(INITIAL_CONTENT);
  expect(docV0.value.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED);

  const docV1 = await ceramic.repository.stateManager.rewind(docState, commit1);
  expect(docV1.id.equals(commit1.baseID)).toBeTruthy();
  expect(docV1.value.log.length).toEqual(2);
  expect(docV1.value.metadata.controllers).toEqual(controllers);
  expect(docV1.value.content).toEqual(INITIAL_CONTENT);
  expect(docV1.value.anchorStatus).toEqual(AnchorStatus.ANCHORED);

  const docV2 = await ceramic.repository.stateManager.rewind(docState, commit2);
  expect(docV2.id.equals(commit2.baseID)).toBeTruthy();
  expect(docV2.value.log.length).toEqual(3);
  expect(docV2.value.metadata.controllers).toEqual(controllers);
  expect(docV2.value.next.content).toEqual(newContent);
  expect(docV2.value.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED);

  const docV3 = await ceramic.repository.stateManager.rewind(docState, commit3);
  expect(docV3.id.equals(commit3.baseID)).toBeTruthy();
  expect(docV3.value.log.length).toEqual(4);
  expect(docV3.value.metadata.controllers).toEqual(controllers);
  expect(docV3.value.content).toEqual(newContent);
  expect(docV3.value.anchorStatus).toEqual(AnchorStatus.ANCHORED);

  const docV4 = await ceramic.repository.stateManager.rewind(docState, commit4);
  expect(docV4.id.equals(commit4.baseID)).toBeTruthy();
  expect(docV4.value.log.length).toEqual(5);
  expect(docV4.value.metadata.controllers).toEqual(controllers);
  expect(docV4.value.next.content).toEqual(finalContent);
  expect(docV4.value.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED);
});

describe('rewind', () => {
  test('non-existing commit', async () => {
    const doc = await TileDoctype.create(ceramic, INITIAL_CONTENT);
    const docState = await ceramic.repository.load(doc.id);
    // Emulate loading a non-existing commit
    const nonExistentCommitID = doc.id.atCommit(FAKE_CID);
    const originalRetrieve = ceramic.dispatcher.retrieveCommit.bind(ceramic.dispatcher);
    ceramic.dispatcher.retrieveCommit = jest.fn(async (cid: CID) => {
      if (cid.equals(FAKE_CID)) {
        return null;
      } else {
        return originalRetrieve(cid);
      }
    });
    await expect(ceramic.repository.stateManager.rewind(docState, nonExistentCommitID)).rejects.toThrow(
      `No commit found for CID ${nonExistentCommitID.commit?.toString()}`,
    );
  });

  test('return read-only snapshot', async () => {
    const doc1 = await TileDoctype.create(ceramic, INITIAL_CONTENT, { deterministic: true });
    await anchorUpdate(ceramic, doc1);
    await doc1.update({ abc: 321, def: 456, gh: 987 });
    await anchorUpdate(ceramic, doc1);

    const ceramic2 = await createCeramic(ipfs, { anchorOnRequest: false });
    const doc2 = await TileDoctype.create(ceramic, INITIAL_CONTENT, { deterministic: true });
    const docState2 = await ceramic2.repository.load(doc2.id);
    const snapshot = await ceramic2.repository.stateManager.rewind(docState2, doc1.commitId);

    expect(DoctypeUtils.statesEqual(snapshot.state, doc1.state));
    const snapshotDoctype = doctypeFromState<TileDoctype>(ceramic2.context, ceramic2._doctypeHandlers, snapshot.value);
    await expect(
      snapshotDoctype.update({ abc: 1010 }),
    ).rejects.toThrow(
      'Historical document commits cannot be modified. Load the document without specifying a commit to make updates.',
    );

    await ceramic2.close();
  });
});

test('handles basic conflict', async () => {
  const doc1 = await TileDoctype.create(ceramic, INITIAL_CONTENT);
  doc1.subscribe();
  const docState1 = await ceramic.repository.load(doc1.id);
  const docId = doc1.id;
  await anchorUpdate(ceramic, doc1);
  const tipPreUpdate = doc1.tip;

  const newContent = { abc: 321, def: 456, gh: 987 };
  let updateRec = await doc1._makeCommit(ceramic.did, newContent)
  await ceramic.repository.stateManager.applyCommit(docState1, updateRec);

  await anchorUpdate(ceramic, doc1);
  expect(doc1.content).toEqual(newContent);
  const tipValidUpdate = doc1.tip;
  // create invalid change that happened after main change

  const initialState = await ceramic.repository.stateManager
    .rewind(docState1, docId.atCommit(docId.cid))
    .then((doc) => doc.state);
  const state$ = new RunningState(initialState);
  ceramic.repository.add(state$);
  await ceramic.repository.stateManager.handleTip(state$, tipPreUpdate);
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const conflictingNewContent = { asdf: 2342 };
  const doc2 = doctypeFromState<TileDoctype>(ceramic.context, ceramic._doctypeHandlers, state$.value, ceramic.repository.updates$);
  doc2.subscribe();
  updateRec = await doc2._makeCommit(ceramic.did, conflictingNewContent)
  await ceramic.repository.stateManager.applyCommit(state$, updateRec);

  await anchorUpdate(ceramic, doc2);
  const tipInvalidUpdate = state$.tip;
  expect(doc2.content).toEqual(conflictingNewContent);
  // loading tip from valid log to doc with invalid
  // log results in valid state
  await ceramic.repository.stateManager.handleTip(state$, tipValidUpdate);
  expect(doc2.content).toEqual(newContent);

  // loading tip from invalid log to doc with valid
  // log results in valid state
  await ceramic.repository.stateManager.handleTip(docState1, tipInvalidUpdate);
  expect(doc1.content).toEqual(newContent);

  // Loading valid commit works
  const docAtValidCommit = await ceramic.repository.stateManager.rewind(docState1, docId.atCommit(tipValidUpdate));
  expect(docAtValidCommit.value.content).toEqual(newContent);

  // Loading invalid commit fails
  await expect(ceramic.repository.stateManager.rewind(docState1, docId.atCommit(tipInvalidUpdate))).rejects.toThrow(
    `Requested commit CID ${tipInvalidUpdate.toString()} not found in the log for document ${docId.toString()}`,
  );
}, 10000);

test('enforces schema in update that assigns schema', async () => {
  const schemaDoc = await TileDoctype.create(ceramic, STRING_MAP_SCHEMA);
  await anchorUpdate(ceramic, schemaDoc);

  const doc = await TileDoctype.create(ceramic, { stuff: 1 });
  const docState = await ceramic.repository.load(doc.id);
  await anchorUpdate(ceramic, doc);
  const updateRec = await doc._makeCommit(ceramic.did, null, { schema: schemaDoc.commitId });
  await expect(ceramic.repository.stateManager.applyCommit(docState, updateRec)).rejects.toThrow(
    "Validation Error: data['stuff'] should be string",
  );
});

test('enforce previously assigned schema during future update', async () => {
  const schemaDoc = await TileDoctype.create(ceramic, STRING_MAP_SCHEMA);
  await anchorUpdate(ceramic, schemaDoc);

  const conformingContent = { stuff: 'foo' };
  const nonConformingContent = { stuff: 1 };
  const doc = await TileDoctype.create(ceramic, conformingContent, { schema: schemaDoc.commitId });
  const docState = await ceramic.repository.load(doc.id);
  await anchorUpdate(ceramic, doc);

  const updateRec = await doc._makeCommit(ceramic.did, nonConformingContent);
  await expect(ceramic.repository.stateManager.applyCommit(docState, updateRec)).rejects.toThrow(
    "Validation Error: data['stuff'] should be string",
  );
});

test('should announce change to network', async () => {
  const publishTip = jest.spyOn(ceramic.dispatcher, 'publishTip');
  const doc1 = await TileDoctype.create(ceramic, INITIAL_CONTENT);
  doc1.subscribe();
  const docState1 = await ceramic.repository.load(doc1.id);
  expect(publishTip).toHaveBeenCalledTimes(1);
  expect(publishTip).toHaveBeenCalledWith(doc1.id, doc1.tip);
  await publishTip.mockClear();

  const updateRec = await doc1._makeCommit(ceramic.did, { foo: 34 });
  await ceramic.repository.stateManager.applyCommit(docState1, updateRec);
  expect(publishTip).toHaveBeenCalledWith(doc1.id, doc1.tip);
});
