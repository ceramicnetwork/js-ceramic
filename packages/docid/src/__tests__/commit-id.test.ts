import * as util from 'util';
import { CommitID } from '../commit-id';
import CID from 'cids';
import * as multibase from 'multibase';

const BASE_CID_STRING = 'bagcqcerakszw2vsovxznyp5gfnpdj4cqm2xiv76yd24wkjewhhykovorwo6a';
const BASE_CID = new CID(BASE_CID_STRING);
const COMMIT_CID_STRING = 'bagjqcgzaday6dzalvmy5ady2m5a5legq5zrbsnlxfc2bfxej532ds7htpova';
const COMMIT_CID = new CID(COMMIT_CID_STRING);

const DOC_ID_STRING = 'kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s';
const DOC_ID_BYTES = multibase.decode(DOC_ID_STRING);
const DOC_ID_URL = 'ceramic://kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s';
const DOC_ID_URL_LEGACY = '/ceramic/kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s';

const DOC_ID_WITH_COMMIT =
  'k1dpgaqe3i64kjqcp801r3sn7ysi5i0k7nxvs7j351s7kewfzr3l7mdxnj7szwo4kr9mn2qki5nnj0cv836ythy1t1gya9s25cn1nexst3jxi5o3h6qprfyju';
const DOC_ID_WITH_COMMIT_BYTES = multibase.decode(DOC_ID_WITH_COMMIT);

const DOC_ID_WITH_0_COMMIT = 'k3y52l7qbv1frxwipl4hp7e6jlu4f6u8upm2xv0irmedfkm5cnutmezzi3u7mytj4';
const DOC_ID_WITH_0_COMMIT_BYTES = multibase.decode(DOC_ID_WITH_0_COMMIT);

const DOC_ID_WITH_COMMIT_LEGACY =
  '/ceramic/kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s?commit=bagjqcgzaday6dzalvmy5ady2m5a5legq5zrbsnlxfc2bfxej532ds7htpova';
const DOC_ID_WITH_0_COMMIT_LEGACY = '/ceramic/kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s?commit=0';

describe('constructor', () => {
  test('create by parts (type:int, cid:cid)', () => {
    const type = 0;
    const docid = new CommitID(type, BASE_CID);

    expect(docid.type).toEqual(type);
    expect(docid.cid).toEqual(BASE_CID);
    expect(docid.toString()).toMatchSnapshot();
  });

  test('create by parts (type:string, cid:string, commit:null)', () => {
    const type = 'tile';
    const docid = new CommitID(type, BASE_CID_STRING, null);

    expect(docid.type).toEqual(0);
    expect(docid.cid).toEqual(BASE_CID);
    expect(docid.commit).toEqual(BASE_CID);
    expect(docid.toString()).toMatchSnapshot();
  });

  test('create by parts (type:string, cid:string, commit:string)', () => {
    const type = 'tile';
    const docid = new CommitID(type, BASE_CID_STRING, BASE_CID_STRING);

    expect(docid.type).toEqual(0);
    expect(docid.cid).toEqual(BASE_CID);
    expect(docid.commit).toEqual(BASE_CID);
    expect(docid.toString()).toMatchSnapshot();
  });

  test('unknown doctype name', () => {
    expect(() => new CommitID('invalid-garbage', BASE_CID_STRING, BASE_CID_STRING)).toThrow();
  });
});

describe('#atCommit', () => {
  const commitId = new CommitID('tile', BASE_CID, COMMIT_CID);

  test('to number 0', () => {
    const traveller = commitId.atCommit(0);
    expect(traveller.commit).toEqual(BASE_CID);
  });
  test('to number 1', () => {
    expect(() => commitId.atCommit(1)).toThrowErrorMatchingSnapshot();
  });
  test('to commit CID', () => {
    const commitId = new CommitID('tile', BASE_CID);
    const traveller = commitId.atCommit(COMMIT_CID);
    expect(traveller.commit).toEqual(COMMIT_CID);
  });
  test('to commit CID as string', () => {
    const commitId = new CommitID('tile', BASE_CID);
    const traveller = commitId.atCommit(COMMIT_CID_STRING);
    expect(traveller.commit).toEqual(COMMIT_CID);
  });
  test('to garbage string', () => {
    expect(() => commitId.atCommit('garbage')).toThrow();
  });
});

describe('.fromBytes', () => {
  test('create from doc id bytes: failure', () => {
    expect(() => CommitID.fromBytes(DOC_ID_BYTES)).toThrow();
  });

  test('invalid doc id', () => {
    expect(() => CommitID.fromBytes(BASE_CID.bytes)).toThrow();
  });

  test('create from bytes inlcuding commit', () => {
    const docid = CommitID.fromBytes(DOC_ID_WITH_COMMIT_BYTES);

    expect(docid.type).toEqual(0);
    expect(docid.cid).toEqual(BASE_CID);
    expect(docid.commit).toEqual(COMMIT_CID);
    expect(docid.toString()).toMatchSnapshot();
  });

  test('create from bytes inlcuding commit 0', () => {
    const docid = CommitID.fromBytes(DOC_ID_WITH_0_COMMIT_BYTES);

    expect(docid.type).toEqual(0);
    expect(docid.cid).toEqual(BASE_CID);
    expect(docid.commit).toEqual(BASE_CID);
    expect(docid.toString()).toMatchSnapshot();
  });

  test('roundtrip docID bytes', () => {
    const commitId = new CommitID('tile', BASE_CID_STRING);
    const commitId2 = CommitID.fromBytes(commitId.bytes);
    expect(commitId.toString()).toEqual(commitId2.toString());
    expect(commitId.bytes).toEqual(commitId2.bytes);
  });

  test('roundtrip docID bytes with commit', () => {
    const docid = new CommitID('tile', BASE_CID_STRING, COMMIT_CID_STRING);
    const docid2 = CommitID.fromBytes(docid.bytes);
    expect(docid.toString()).toEqual(docid2.toString());
    expect(docid.bytes).toEqual(docid2.bytes);
  });

  test('roundtrip docID bytes with commit', () => {
    const docid = new CommitID('tile', BASE_CID_STRING, 0);
    const docid2 = CommitID.fromBytes(docid.bytes);
    expect(docid.toString()).toEqual(docid2.toString());
    expect(docid.bytes).toEqual(docid2.bytes);
  });
});

describe('.fromString', () => {
  test('create from doc id string: fail', () => {
    expect(() => CommitID.fromString(DOC_ID_STRING)).toThrow()
  });

  test('create from string including commit', () => {
    const docid = CommitID.fromString(DOC_ID_WITH_COMMIT);

    expect(docid.type).toEqual(0);
    expect(docid.cid).toEqual(BASE_CID);
    expect(docid.commit).toEqual(COMMIT_CID);
    expect(docid.toString()).toMatchSnapshot();
  });

  test('create from string including commit 0', () => {
    const docid = CommitID.fromString(DOC_ID_WITH_0_COMMIT);

    expect(docid.type).toEqual(0);
    expect(docid.cid).toEqual(BASE_CID);
    expect(docid.commit).toEqual(BASE_CID);
    expect(docid.toString()).toMatchSnapshot();
  });

  test('create from doc id url string: fail', () => {
    expect(() => CommitID.fromString(DOC_ID_URL)).toThrow()
  });

  test('create from legacy docid string "/ceramic/": fail', () => {
    expect(() => CommitID.fromString(DOC_ID_URL_LEGACY))
  });

  test('create from legacy string "/ceramic/" with commit param "?commit="', () => {
    const docid = CommitID.fromString(DOC_ID_WITH_COMMIT_LEGACY);

    expect(docid.type).toEqual(0);
    expect(docid.cid).toEqual(BASE_CID);
    expect(docid.commit).toEqual(COMMIT_CID);
    expect(docid.toString()).toMatchSnapshot();
  });

  test('create from legacy string "/ceramic/" with commit param "?commit=0"', () => {
    const docid = CommitID.fromString(DOC_ID_WITH_0_COMMIT_LEGACY);

    expect(docid.type).toEqual(0);
    expect(docid.cid).toEqual(BASE_CID);
    expect(docid.commit).toEqual(BASE_CID);
    expect(docid.toString()).toMatchSnapshot();
  });

  test('roundtrip docID string', () => {
    const docid = new CommitID('tile', BASE_CID_STRING);
    const docid2 = CommitID.fromString(docid.toString());
    expect(docid.toString()).toEqual(docid2.toString());
  });

  test('roundtrip docID string with commit', () => {
    const docid = new CommitID('tile', BASE_CID_STRING, COMMIT_CID_STRING);
    const docid2 = CommitID.fromString(docid.toString());
    expect(docid.toString()).toEqual(docid2.toString());
  });

  test('roundtrip docID string with commit 0', () => {
    const docid = new CommitID('tile', BASE_CID_STRING, 0);
    const docid2 = CommitID.fromString(docid.toString());
    expect(docid.toString()).toEqual(docid2.toString());
  });
});

test('.bytes', () => {
  const docid = new CommitID('tile', BASE_CID_STRING);
  const bytes = docid.bytes;
  expect(bytes).toBeDefined();
  expect(bytes instanceof Uint8Array).toEqual(true);
  expect(bytes).toMatchSnapshot();
});

test('.typeName if registered', () => {
  const docid = new CommitID('tile', BASE_CID_STRING, null);
  expect(docid.typeName).toEqual('tile');
  const docid2 = new CommitID(10, BASE_CID_STRING);
  expect(() => docid2.typeName).toThrowErrorMatchingSnapshot();
});

test('.toString()', () => {
  const docid = new CommitID('tile', BASE_CID_STRING);
  const str = docid.toString();
  expect(str).toBeDefined();
  expect(str).toMatchSnapshot();
});

test('.toUrl()', () => {
  const docid = new CommitID('tile', BASE_CID_STRING);
  const str = docid.toUrl();
  expect(str).toBeDefined();
  expect(str.includes('ceramic://')).toEqual(true);
  expect(str).toMatchSnapshot();
});

describe('#equals', () => {
  test('equals other DocID', () => {
    const docid = new CommitID('tile', BASE_CID_STRING);
    const docid2 = new CommitID('tile', BASE_CID_STRING);
    const docid3 = new CommitID('caip10-link', BASE_CID_STRING);
    expect(docid.equals(docid2)).toEqual(true);
    expect(docid.equals(docid3)).toEqual(false);
  });
});

describe('nodejs inspect', () => {
  test('genesis commit', () => {
    const docid = new CommitID('tile', BASE_CID_STRING);
    expect(util.inspect(docid)).toMatchSnapshot();
  });
  test('commit', () => {
    const docid = new CommitID('tile', BASE_CID_STRING, COMMIT_CID_STRING);
    expect(util.inspect(docid)).toMatchSnapshot();
  });
});

test('to primitive', () => {
  const docid = new CommitID('tile', BASE_CID_STRING, COMMIT_CID_STRING);
  expect(`${docid}`).toEqual(docid.toString());
  expect(+docid).toBeNaN();
  expect(docid + '').toEqual(docid.toString());
});

test('#baseID', () => {
  const commitId = new CommitID('tile', BASE_CID_STRING, COMMIT_CID_STRING);
  const docId = commitId.baseID;
  expect(docId.type).toEqual(commitId.type);
  expect(docId.cid).toEqual(commitId.cid);
});
