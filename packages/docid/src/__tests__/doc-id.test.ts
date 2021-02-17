import { DocID } from '../doc-id';
import CID from 'cids';
import * as util from 'util';
import * as multibase from 'multibase';

const CID_STRING = 'bagcqcerakszw2vsovxznyp5gfnpdj4cqm2xiv76yd24wkjewhhykovorwo6a';
const DOC_ID_STRING = 'kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s';
const DOC_ID_URL = 'ceramic://kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s';
const DOC_ID_BYTES = multibase.decode(DOC_ID_STRING);
const DOC_ID_LEGACY = '/ceramic/kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s';

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
    const cid = new CID(CID_STRING);
    const docid = new DocID(type, cid);

    expect(docid.type).toEqual(type);
    expect(docid.cid.toString()).toEqual(CID_STRING);
    expect(docid.toString()).toMatchSnapshot();
  });
});

describe('.fromBytes', () => {
  test('create from bytes ', () => {
    const docid = DocID.fromBytes(DOC_ID_BYTES);

    expect(docid.type).toEqual(0);
    expect(docid.cid.toString()).toEqual(CID_STRING);
    expect(docid.toString()).toMatchSnapshot();
  });

  test('fail to create from garbage bytes', () => {
    expect(() =>
      DocID.fromBytes(new CID('bagcqcerakszw2vsovxznyp5gfnpdj4cqm2xiv76yd24wkjewhhykovorwo6a').bytes),
    ).toThrow();
  });

  test('create from bytes including commit: fail', () => {
    expect(() => DocID.fromBytes(DOC_ID_WITH_COMMIT_BYTES)).toThrow()
  });

  test('create from bytes including commit 0: fail', () => {
    expect(() => DocID.fromBytes(DOC_ID_WITH_0_COMMIT_BYTES)).toThrow()
  });

  test('roundtrip docID bytes', () => {
    const docid = new DocID('tile', CID_STRING);
    const docid2 = DocID.fromBytes(docid.bytes);
    expect(docid.toString()).toEqual(docid2.toString());
  });
});

describe('.fromString', () => {
  test('create from string', () => {
    const docid = DocID.fromString(DOC_ID_STRING);

    expect(docid.type).toEqual(0);
    expect(docid.cid.toString()).toEqual(CID_STRING);
    expect(docid.toString()).toMatchSnapshot();
  });

  test('create from string including commit: fail', () => {
    expect(() => DocID.fromString(DOC_ID_WITH_COMMIT)).toThrow()
  });

  test('create from string including commit 0: fail', () => {
    expect(() => DocID.fromString(DOC_ID_WITH_0_COMMIT)).toThrow()
  });

  test('create from url string', () => {
    const docid = DocID.fromString(DOC_ID_URL);

    expect(docid.type).toEqual(0);
    expect(docid.cid.toString()).toEqual(CID_STRING);
    expect(docid.toString()).toMatchSnapshot();
  });

  test('create from legacy string "/ceramic/"', () => {
    const docid = DocID.fromString(DOC_ID_LEGACY);

    expect(docid.type).toEqual(0);
    expect(docid.cid.toString()).toEqual(CID_STRING);
    expect(docid.toString()).toMatchSnapshot();
  });

  test('create from legacy string "/ceramic/" with commit param "?commit="', () => {
    const docid = DocID.fromString(DOC_ID_WITH_COMMIT_LEGACY);

    expect(docid.type).toEqual(0);
    expect(docid.cid.toString()).toEqual(CID_STRING);
    expect(docid.toString()).toMatchSnapshot();
  });

  test('create from legacy string "/ceramic/" with commit param "?commit=0"', () => {
    const docid = DocID.fromString(DOC_ID_WITH_0_COMMIT_LEGACY);

    expect(docid.type).toEqual(0);
    expect(docid.cid.toString()).toEqual(CID_STRING);
    expect(docid.toString()).toMatchSnapshot();
  });

  test('roundtrip docID string', () => {
    const docid = new DocID('tile', CID_STRING);
    const docid2 = DocID.fromString(docid.toString());
    expect(docid.toString()).toEqual(docid2.toString());
  });
});

test('.bytes', () => {
  const docid = new DocID('tile', CID_STRING);
  const bytes = docid.bytes;
  expect(bytes).toBeDefined();
  expect(bytes instanceof Uint8Array).toEqual(true);
  expect(bytes).toMatchSnapshot();
});

test('.typeName if registered', () => {
  const docid = new DocID('tile', CID_STRING);
  expect(docid.typeName).toEqual('tile');
  const docid2 = new DocID(10, CID_STRING);
  expect(() => docid2.typeName).toThrowErrorMatchingSnapshot();
});

test('.toString()', () => {
  const docid = new DocID('tile', CID_STRING);
  const str = docid.toString();
  expect(str).toBeDefined();
  expect(str).toMatchSnapshot();
});

test('.toUrl()', () => {
  const docid = new DocID('tile', CID_STRING);
  const str = docid.toUrl();
  expect(str).toBeDefined();
  expect(str.includes('ceramic://')).toEqual(true);
  expect(str).toMatchSnapshot();
});

test('equals other DocID', () => {
  const docid = new DocID('tile', CID_STRING);
  const docid2 = new DocID('tile', CID_STRING);
  const docid3 = new DocID('caip10-link', CID_STRING);
  expect(docid.equals(docid2)).toEqual(true);
  expect(docid.equals(docid3)).toEqual(false);
});

test('nodejs inspect', () => {
  const docid = new DocID('tile', CID_STRING);
  expect(util.inspect(docid)).toMatchSnapshot();
});

test('to primitive', () => {
  const docid = new DocID('tile', CID_STRING);
  expect(`${docid}`).toEqual(docid.toString());
  expect(+docid).toBeNaN();
  expect(docid + '').toEqual(docid.toString());
});

describe('#atCommit', () => {
  const BASE_CID = new CID(CID_STRING);
  const COMMIT_CID_STRING = 'bagjqcgzaday6dzalvmy5ady2m5a5legq5zrbsnlxfc2bfxej532ds7htpova';
  const COMMIT_CID = new CID(COMMIT_CID_STRING);

  const docId = new DocID('tile', BASE_CID);

  test('to number 0', () => {
    const commitId = docId.atCommit(0);
    expect(commitId.commit).toEqual(BASE_CID);
  });
  test('to number 1', () => {
    expect(() => docId.atCommit(1)).toThrowErrorMatchingSnapshot();
  });
  test('to commit CID', () => {
    const commitId = docId.atCommit(COMMIT_CID);
    expect(commitId.commit).toEqual(COMMIT_CID);
  });
  test('to commit CID as string', () => {
    const commitId = docId.atCommit(COMMIT_CID_STRING);
    expect(commitId.commit).toEqual(COMMIT_CID);
  });
  test('to garbage string', () => {
    expect(() => docId.atCommit('garbage')).toThrow();
  });
});
