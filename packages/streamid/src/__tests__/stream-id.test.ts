import { StreamID } from '../stream-id';
import CID from 'cids';
import * as util from 'util';
import * as multibase from 'multibase';

const CID_STRING = 'bagcqcerakszw2vsovxznyp5gfnpdj4cqm2xiv76yd24wkjewhhykovorwo6a';
const STREAM_ID_STRING = 'kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s';
const STREAM_ID_URL = 'ceramic://kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s';
const STREAM_ID_BYTES = multibase.decode(STREAM_ID_STRING);
const STREAM_ID_LEGACY = '/ceramic/kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s';

const STREAM_ID_WITH_COMMIT =
  'k1dpgaqe3i64kjqcp801r3sn7ysi5i0k7nxvs7j351s7kewfzr3l7mdxnj7szwo4kr9mn2qki5nnj0cv836ythy1t1gya9s25cn1nexst3jxi5o3h6qprfyju';
const STREAM_ID_WITH_COMMIT_BYTES = multibase.decode(STREAM_ID_WITH_COMMIT);
const STREAM_ID_WITH_0_COMMIT = 'k3y52l7qbv1frxwipl4hp7e6jlu4f6u8upm2xv0irmedfkm5cnutmezzi3u7mytj4';
const STREAM_ID_WITH_0_COMMIT_BYTES = multibase.decode(STREAM_ID_WITH_0_COMMIT);
const STREAM_ID_WITH_COMMIT_LEGACY =
  '/ceramic/kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s?commit=bagjqcgzaday6dzalvmy5ady2m5a5legq5zrbsnlxfc2bfxej532ds7htpova';
const STREAM_ID_WITH_0_COMMIT_LEGACY = '/ceramic/kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s?commit=0';

describe('constructor', () => {
  test('create by parts (type:int, cid:cid)', () => {
    const type = 0;
    const cid = new CID(CID_STRING);
    const streamid = new StreamID(type, cid);

    expect(streamid.type).toEqual(type);
    expect(streamid.cid.toString()).toEqual(CID_STRING);
    expect(streamid.toString()).toMatchSnapshot();
  });
});

describe('.fromBytes', () => {
  test('create from bytes ', () => {
    const streamid = StreamID.fromBytes(STREAM_ID_BYTES);

    expect(streamid.type).toEqual(0);
    expect(streamid.cid.toString()).toEqual(CID_STRING);
    expect(streamid.toString()).toMatchSnapshot();
  });

  test('fail to create from garbage bytes', () => {
    expect(() =>
      StreamID.fromBytes(new CID('bagcqcerakszw2vsovxznyp5gfnpdj4cqm2xiv76yd24wkjewhhykovorwo6a').bytes),
    ).toThrow();
  });

  test('create from bytes including commit: fail', () => {
    expect(() => StreamID.fromBytes(STREAM_ID_WITH_COMMIT_BYTES)).toThrow()
  });

  test('create from bytes including commit 0: fail', () => {
    expect(() => StreamID.fromBytes(STREAM_ID_WITH_0_COMMIT_BYTES)).toThrow()
  });

  test('roundtrip streamID bytes', () => {
    const streamid = new StreamID('tile', CID_STRING);
    const streamid2 = StreamID.fromBytes(streamid.bytes);
    expect(streamid.toString()).toEqual(streamid2.toString());
  });
});

describe('.fromString', () => {
  test('create from string', () => {
    const streamid = StreamID.fromString(STREAM_ID_STRING);

    expect(streamid.type).toEqual(0);
    expect(streamid.cid.toString()).toEqual(CID_STRING);
    expect(streamid.toString()).toMatchSnapshot();
  });

  test('create from string including commit: fail', () => {
    expect(() => StreamID.fromString(STREAM_ID_WITH_COMMIT)).toThrow()
  });

  test('create from string including commit 0: fail', () => {
    expect(() => StreamID.fromString(STREAM_ID_WITH_0_COMMIT)).toThrow()
  });

  test('create from url string', () => {
    const streamid = StreamID.fromString(STREAM_ID_URL);

    expect(streamid.type).toEqual(0);
    expect(streamid.cid.toString()).toEqual(CID_STRING);
    expect(streamid.toString()).toMatchSnapshot();
  });

  test('create from legacy string "/ceramic/"', () => {
    const streamid = StreamID.fromString(STREAM_ID_LEGACY);

    expect(streamid.type).toEqual(0);
    expect(streamid.cid.toString()).toEqual(CID_STRING);
    expect(streamid.toString()).toMatchSnapshot();
  });

  test('create from legacy string "/ceramic/" with commit param "?commit="', () => {
    const streamid = StreamID.fromString(STREAM_ID_WITH_COMMIT_LEGACY);

    expect(streamid.type).toEqual(0);
    expect(streamid.cid.toString()).toEqual(CID_STRING);
    expect(streamid.toString()).toMatchSnapshot();
  });

  test('create from legacy string "/ceramic/" with commit param "?commit=0"', () => {
    const streamid = StreamID.fromString(STREAM_ID_WITH_0_COMMIT_LEGACY);

    expect(streamid.type).toEqual(0);
    expect(streamid.cid.toString()).toEqual(CID_STRING);
    expect(streamid.toString()).toMatchSnapshot();
  });

  test('roundtrip streamID string', () => {
    const streamid = new StreamID('tile', CID_STRING);
    const streamid2 = StreamID.fromString(streamid.toString());
    expect(streamid.toString()).toEqual(streamid2.toString());
  });
});

test('.bytes', () => {
  const streamid = new StreamID('tile', CID_STRING);
  const bytes = streamid.bytes;
  expect(bytes).toBeDefined();
  expect(bytes instanceof Uint8Array).toEqual(true);
  expect(bytes).toMatchSnapshot();
});

test('.typeName if registered', () => {
  const streamid = new StreamID('tile', CID_STRING);
  expect(streamid.typeName).toEqual('tile');
  const streamid2 = new StreamID(10, CID_STRING);
  expect(() => streamid2.typeName).toThrowErrorMatchingSnapshot();
});

test('.toString()', () => {
  const streamid = new StreamID('tile', CID_STRING);
  const str = streamid.toString();
  expect(str).toBeDefined();
  expect(str).toMatchSnapshot();
});

test('.toUrl()', () => {
  const streamid = new StreamID('tile', CID_STRING);
  const str = streamid.toUrl();
  expect(str).toBeDefined();
  expect(str.includes('ceramic://')).toEqual(true);
  expect(str).toMatchSnapshot();
});

test('equals other StreamID', () => {
  const streamid = new StreamID('tile', CID_STRING);
  const streamid2 = new StreamID('tile', CID_STRING);
  const streamid3 = new StreamID('caip10-link', CID_STRING);
  expect(streamid.equals(streamid2)).toEqual(true);
  expect(streamid.equals(streamid3)).toEqual(false);
});

test('nodejs inspect', () => {
  const streamid = new StreamID('tile', CID_STRING);
  expect(util.inspect(streamid)).toMatchSnapshot();
});

test('to primitive', () => {
  const streamid = new StreamID('tile', CID_STRING);
  expect(`${streamid}`).toEqual(streamid.toString());
  expect(+streamid).toBeNaN();
  expect(streamid + '').toEqual(streamid.toString());
});

describe('#atCommit', () => {
  const BASE_CID = new CID(CID_STRING);
  const COMMIT_CID_STRING = 'bagjqcgzaday6dzalvmy5ady2m5a5legq5zrbsnlxfc2bfxej532ds7htpova';
  const COMMIT_CID = new CID(COMMIT_CID_STRING);

  const streamId = new StreamID('tile', BASE_CID);

  test('to number 0', () => {
    const commitId = streamId.atCommit(0);
    expect(commitId.commit).toEqual(BASE_CID);
  });
  test('to number 1', () => {
    expect(() => streamId.atCommit(1)).toThrowErrorMatchingSnapshot();
  });
  test('to commit CID', () => {
    const commitId = streamId.atCommit(COMMIT_CID);
    expect(commitId.commit).toEqual(COMMIT_CID);
  });
  test('to commit CID as string', () => {
    const commitId = streamId.atCommit(COMMIT_CID_STRING);
    expect(commitId.commit).toEqual(COMMIT_CID);
  });
  test('to garbage string', () => {
    expect(() => streamId.atCommit('garbage')).toThrow();
  });
});

test('instanceof', () => {
  const streamId = StreamID.fromString(STREAM_ID_STRING)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const instanceSpy = jest.spyOn(StreamID, Symbol.hasInstance)
  expect(streamId instanceof StreamID).toBeTruthy()
  expect(instanceSpy).toBeCalledWith(streamId)
})
