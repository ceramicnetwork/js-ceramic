import { DocID } from '@ceramicnetwork/docid';
import { AnchorStatus, CommitType, DocState, DoctypeUtils, IpfsApi, SignatureStatus } from '@ceramicnetwork/common';
import CID from 'cids';
import { RunningState } from '../state-management/running-state';
import { Document } from '../document';
import { TileDoctypeHandler } from '@ceramicnetwork/doctype-tile-handler';
import { createIPFS } from './ipfs-util';
import { createCeramic } from './create-ceramic';
import Ceramic from '../ceramic';
import { anchorUpdate } from '../state-management/__tests__/anchor-update';
import { TileDoctype } from '@ceramicnetwork/doctype-tile';

const FAKE_CID = new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu');
const DOC_ID = new DocID('tile', FAKE_CID);
const INITIAL_CONTENT = { abc: 123, def: 456 };
const INITIAL_DOC_STATE: DocState = {
  doctype: 'tile',
  content: INITIAL_CONTENT,
  metadata: { controllers: ['foo'] },
  signature: SignatureStatus.GENESIS,
  anchorStatus: AnchorStatus.NOT_REQUESTED,
  log: [{ cid: FAKE_CID, type: CommitType.GENESIS }],
};
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

test('constructor', async () => {
  const runningState = new RunningState(INITIAL_DOC_STATE);
  const dispatcher = ceramic.dispatcher;
  const pinStore = ceramic.repository.pinStore;
  const context = ceramic.context;
  const doc = new Document(runningState, dispatcher, pinStore, true, context, new TileDoctypeHandler());

  expect(doc.id).toEqual(DOC_ID);
  expect(doc.state.content).toEqual(INITIAL_CONTENT);
  expect(doc.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED);
});

describe('anchor', () => {
  test('anchor call', async () => {
    const doctype = await ceramic.createDocument('tile', {
      content: INITIAL_CONTENT,
      metadata: { controllers: [ceramic.did.id] },
    });
    const doc = await ceramic.repository.load(doctype.id);
    await new Promise((resolve) => {
      doc.anchor().add(resolve);
    });
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED);
  });
});

test('_handleTip', async () => {
  const doctype1 = await ceramic.createDocument('tile', {
    content: INITIAL_CONTENT,
    metadata: { controllers },
  });
  const doc1 = await ceramic.repository.load(doctype1.id);
  await new Promise((resolve) => doc1.anchor().add(resolve));

  const ceramic2 = await createCeramic(ipfs);
  const doctype2 = await ceramic2.loadDocument(doctype1.id, { sync: false });
  const doc2 = await ceramic2.repository.load(doctype2.id);

  expect(doctype2.content).toEqual(doctype1.content);
  expect(doctype2.state).toEqual(expect.objectContaining({ signature: SignatureStatus.SIGNED, anchorStatus: 0 }));

  await doc2._handleTip(doctype1.state.log[1].cid);

  expect(doctype2.state).toEqual(doctype1.state);
  await ceramic2.close();
});

test('commit history and rewind', async () => {
  const doctype = await ceramic.createDocument('tile', {
    content: INITIAL_CONTENT,
    metadata: { controllers },
  });
  const doc = await ceramic.repository.load(doctype.id);

  const commit0 = doctype.allCommitIds[0];
  expect(doctype.commitId).toEqual(commit0);
  expect(commit0.equals(doc.id.atCommit(doc.id.cid))).toBeTruthy();
  expect(doctype.anchorCommitIds.length).toEqual(0);

  await anchorUpdate(ceramic, doctype);
  expect(doctype.allCommitIds.length).toEqual(2);
  expect(doctype.anchorCommitIds.length).toEqual(1);
  const commit1 = doctype.allCommitIds[1];
  expect(commit1.equals(commit0)).toBeFalsy();
  expect(commit1).toEqual(doctype.commitId);
  expect(commit1).toEqual(doctype.anchorCommitIds[0]);

  const newContent = { abc: 321, def: 456, gh: 987 };
  const updateRec = await TileDoctype._makeCommit(doctype, ceramic.did, newContent, doctype.controllers);
  await doc.applyCommit(updateRec);
  expect(doctype.allCommitIds.length).toEqual(3);
  expect(doctype.anchorCommitIds.length).toEqual(1);
  const commit2 = doctype.allCommitIds[2];
  expect(commit2.equals(commit1)).toBeFalsy();
  expect(commit2).toEqual(doctype.commitId);

  await anchorUpdate(ceramic, doctype);
  expect(doctype.allCommitIds.length).toEqual(4);
  expect(doctype.anchorCommitIds.length).toEqual(2);
  const commit3 = doctype.allCommitIds[3];
  expect(commit3.equals(commit2)).toBeFalsy();
  expect(commit3).toEqual(doctype.commitId);
  expect(commit3).toEqual(doctype.anchorCommitIds[1]);
  expect(doctype.content).toEqual(newContent);
  expect(doctype.state.signature).toEqual(SignatureStatus.SIGNED);
  expect(doctype.state.anchorStatus).not.toEqual(AnchorStatus.NOT_REQUESTED);
  expect(doctype.state.log.length).toEqual(4);

  // Apply a final record that does not get anchored
  const finalContent = { foo: 'bar' };
  const updateRec2 = await TileDoctype._makeCommit(doctype, ceramic.did, finalContent, doctype.controllers);
  await doc.applyCommit(updateRec2);

  expect(doctype.allCommitIds.length).toEqual(5);
  expect(doctype.anchorCommitIds.length).toEqual(2);
  const commit4 = doctype.allCommitIds[4];
  expect(commit4.equals(commit3)).toBeFalsy();
  expect(commit4).toEqual(doctype.commitId);
  expect(commit4.equals(doctype.anchorCommitIds[1])).toBeFalsy();
  expect(doctype.state.log.length).toEqual(5);

  // Correctly check out a specific commit
  const docV0 = await doc.rewind(commit0);
  expect(docV0.id.equals(commit0.baseID)).toBeTruthy();
  expect(docV0.state.log.length).toEqual(1);
  expect(docV0.doctype.controllers).toEqual(controllers);
  expect(docV0.doctype.content).toEqual(INITIAL_CONTENT);
  expect(docV0.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED);

  const docV1 = await doc.rewind(commit1);
  expect(docV1.id.equals(commit1.baseID)).toBeTruthy();
  expect(docV1.state.log.length).toEqual(2);
  expect(docV1.doctype.controllers).toEqual(controllers);
  expect(docV1.doctype.content).toEqual(INITIAL_CONTENT);
  expect(docV1.state.anchorStatus).toEqual(AnchorStatus.ANCHORED);

  const docV2 = await doc.rewind(commit2);
  expect(docV2.id.equals(commit2.baseID)).toBeTruthy();
  expect(docV2.state.log.length).toEqual(3);
  expect(docV2.doctype.controllers).toEqual(controllers);
  expect(docV2.doctype.content).toEqual(newContent);
  expect(docV2.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED);

  const docV3 = await doc.rewind(commit3);
  expect(docV3.id.equals(commit3.baseID)).toBeTruthy();
  expect(docV3.state.log.length).toEqual(4);
  expect(docV3.doctype.controllers).toEqual(controllers);
  expect(docV3.doctype.content).toEqual(newContent);
  expect(docV3.state.anchorStatus).toEqual(AnchorStatus.ANCHORED);

  const docV4 = await doc.rewind(commit4);
  expect(docV4.id.equals(commit4.baseID)).toBeTruthy();
  expect(docV4.state.log.length).toEqual(5);
  expect(docV4.doctype.controllers).toEqual(controllers);
  expect(docV4.doctype.content).toEqual(finalContent);
  expect(docV4.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED);
});

describe('rewind', () => {
  test('non-existing commit', async () => {
    const doctype = await ceramic.createDocument('tile', {
      content: INITIAL_CONTENT,
      metadata: { controllers },
    });
    const doc = await ceramic.repository.load(doctype.id);
    // Emulate loading a non-existing commit
    const nonExistentCommitID = doctype.id.atCommit(FAKE_CID);
    const originalRetrieve = ceramic.dispatcher.retrieveCommit.bind(ceramic.dispatcher);
    ceramic.dispatcher.retrieveCommit = jest.fn(async (cid: CID) => {
      if (cid.equals(FAKE_CID)) {
        return null;
      } else {
        return originalRetrieve(cid);
      }
    });
    await expect(doc.rewind(nonExistentCommitID)).rejects.toThrow(
      `No commit found for CID ${nonExistentCommitID.commit?.toString()}`,
    );
  });

  test('return read-only snapshot', async () => {
    const genesisParams = {
      content: INITIAL_CONTENT,
      metadata: { controllers },
      deterministic: true,
    };
    const doctype1 = await ceramic.createDocument('tile', genesisParams);
    await anchorUpdate(ceramic, doctype1);
    await doctype1.change({
      content: { abc: 321, def: 456, gh: 987 },
    });
    await anchorUpdate(ceramic, doctype1);

    const ceramic2 = await createCeramic(ipfs, { anchorOnRequest: false });
    const doctype2 = await ceramic2.createDocument('tile', genesisParams);
    const doc2 = await ceramic2.repository.load(doctype2.id);
    const snapshot = await doc2.rewind(doctype1.commitId);

    expect(DoctypeUtils.statesEqual(snapshot.state, doctype1.state));
    const snapshotDoctype = snapshot.doctype;
    await expect(
      snapshotDoctype.change({
        content: { abc: 1010 },
      }),
    ).rejects.toThrow(
      'Historical document commits cannot be modified. Load the document without specifying a commit to make updates.',
    );

    await ceramic2.close();
  });
});

test('handles basic conflict', async () => {
  const doctype1 = await ceramic.createDocument('tile', {
    content: INITIAL_CONTENT,
    metadata: { controllers },
  });
  const doc1 = await ceramic.repository.load(doctype1.id);
  const docId = doctype1.id;
  await anchorUpdate(ceramic, doctype1);
  const tipPreUpdate = doctype1.tip;

  const newContent = { abc: 321, def: 456, gh: 987 };
  let updateRec = await TileDoctype._makeCommit(doctype1, ceramic.did, newContent, doctype1.controllers);
  await doc1.applyCommit(updateRec);

  await anchorUpdate(ceramic, doctype1);
  expect(doctype1.content).toEqual(newContent);
  const tipValidUpdate = doctype1.tip;
  // create invalid change that happened after main change

  const initialState = await doc1.rewind(docId.atCommit(docId.cid)).then((doc) => doc.state);
  const doc2 = new Document(
    new RunningState(initialState),
    ceramic.dispatcher,
    ceramic.repository.pinStore,
    true,
    ceramic.context,
    new TileDoctypeHandler(),
  );
  await doc2._handleTip(tipPreUpdate);

  const conflictingNewContent = { asdf: 2342 };
  updateRec = await TileDoctype._makeCommit(doc2.doctype, ceramic.did, conflictingNewContent, doc2.doctype.controllers);
  await doc2.applyCommit(updateRec);

  await anchorUpdate(ceramic, doc2.doctype);
  const tipInvalidUpdate = doc2.tip;
  expect(doc2.doctype.content).toEqual(conflictingNewContent);
  // loading tip from valid log to doc with invalid
  // log results in valid state
  await doc2._handleTip(tipValidUpdate);
  expect(doc2.doctype.content).toEqual(newContent);

  // loading tip from invalid log to doc with valid
  // log results in valid state
  await doc1._handleTip(tipInvalidUpdate);
  expect(doctype1.content).toEqual(newContent);

  // Loading valid commit works
  const docAtValidCommit = await doc1.rewind(docId.atCommit(tipValidUpdate));
  expect(docAtValidCommit.doctype.content).toEqual(newContent);

  // Loading invalid commit fails
  await expect(doc1.rewind(docId.atCommit(tipInvalidUpdate))).rejects.toThrow(
    `Requested commit CID ${tipInvalidUpdate.toString()} not found in the log for document ${docId.toString()}`,
  );
});

test('enforces schema in update that assigns schema', async () => {
  const schemaDoc = await ceramic.createDocument('tile', {
    content: STRING_MAP_SCHEMA,
    metadata: { controllers },
  });
  await anchorUpdate(ceramic, schemaDoc);

  const doctype = await ceramic.createDocument('tile', {
    content: { stuff: 1 },
    metadata: { controllers },
  });
  const doc = await ceramic.repository.load(doctype.id);
  await anchorUpdate(ceramic, doctype);
  const updateRec = await TileDoctype._makeCommit(
    doctype,
    ceramic.did,
    null,
    doctype.controllers,
    schemaDoc.commitId.toString(),
  );
  await expect(doc.applyCommit(updateRec)).rejects.toThrow("Validation Error: data['stuff'] should be string");
});

test('enforce previously assigned schema during future update', async () => {
  const schemaDoc = await ceramic.createDocument('tile', {
    content: STRING_MAP_SCHEMA,
    metadata: { controllers },
  });
  await anchorUpdate(ceramic, schemaDoc);

  const conformingContent = { stuff: 'foo' };
  const nonConformingContent = { stuff: 1 };
  const doctype = await ceramic.createDocument('tile', {
    content: conformingContent,
    metadata: { controllers, schema: schemaDoc.commitId.toString() },
  });
  const doc = await ceramic.repository.load(doctype.id);
  await anchorUpdate(ceramic, doctype);

  const updateRec = await TileDoctype._makeCommit(doctype, ceramic.did, nonConformingContent, doctype.controllers);
  await expect(doc.applyCommit(updateRec)).rejects.toThrow("Validation Error: data['stuff'] should be string");
});

test('should announce change to network', async () => {
  const publishTip = jest.spyOn(ceramic.dispatcher, 'publishTip')
  const doctype1 = await ceramic.createDocument('tile', { content: INITIAL_CONTENT, metadata: { controllers } })
  const doc1 = await ceramic.repository.load(doctype1.id)
  expect(publishTip).toHaveBeenCalledTimes(1)
  expect(publishTip).toHaveBeenCalledWith(doctype1.id, doctype1.tip)
  await publishTip.mockClear()

  const updateRec = await TileDoctype._makeCommit(doctype1, ceramic.did, {foo: 34}, doctype1.controllers)
  await doc1.applyCommit(updateRec)
  expect(publishTip).toHaveBeenCalledTimes(1)
  expect(publishTip).toHaveBeenCalledWith(doctype1.id, doctype1.tip)
});
