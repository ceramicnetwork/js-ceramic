import * as util from 'util'
import { CommitID } from '../commit-id'
import CID from 'cids'
import * as multibase from 'multibase'

const BASE_CID_STRING = 'bagcqcerakszw2vsovxznyp5gfnpdj4cqm2xiv76yd24wkjewhhykovorwo6a'
const BASE_CID = new CID(BASE_CID_STRING)
const COMMIT_CID_STRING = 'bagjqcgzaday6dzalvmy5ady2m5a5legq5zrbsnlxfc2bfxej532ds7htpova'
const COMMIT_CID = new CID(COMMIT_CID_STRING)

const STREAM_ID_STRING = 'kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s'
const STREAM_ID_BYTES = multibase.decode(STREAM_ID_STRING)
const STREAM_ID_URL = 'ceramic://kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s'
const STREAM_ID_URL_LEGACY =
  '/ceramic/kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s'

const STREAM_ID_WITH_COMMIT =
  'k1dpgaqe3i64kjqcp801r3sn7ysi5i0k7nxvs7j351s7kewfzr3l7mdxnj7szwo4kr9mn2qki5nnj0cv836ythy1t1gya9s25cn1nexst3jxi5o3h6qprfyju'
const STREAM_ID_WITH_COMMIT_BYTES = multibase.decode(STREAM_ID_WITH_COMMIT)

const STREAM_ID_WITH_0_COMMIT = 'k3y52l7qbv1frxwipl4hp7e6jlu4f6u8upm2xv0irmedfkm5cnutmezzi3u7mytj4'
const STREAM_ID_WITH_0_COMMIT_BYTES = multibase.decode(STREAM_ID_WITH_0_COMMIT)

const STREAM_ID_WITH_COMMIT_LEGACY =
  '/ceramic/kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s?commit=bagjqcgzaday6dzalvmy5ady2m5a5legq5zrbsnlxfc2bfxej532ds7htpova'
const STREAM_ID_WITH_0_COMMIT_LEGACY =
  '/ceramic/kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s?commit=0'

describe('constructor', () => {
  test('create by parts (type:int, cid:cid)', () => {
    const type = 0
    const streamid = new CommitID(type, BASE_CID)

    expect(streamid.type).toEqual(type)
    expect(streamid.cid).toEqual(BASE_CID)
    expect(streamid.toString()).toMatchSnapshot()
  })

  test('create by parts (type:string, cid:string, commit:null)', () => {
    const type = 'tile'
    const streamid = new CommitID(type, BASE_CID_STRING, null)

    expect(streamid.type).toEqual(0)
    expect(streamid.cid).toEqual(BASE_CID)
    expect(streamid.commit).toEqual(BASE_CID)
    expect(streamid.toString()).toMatchSnapshot()
  })

  test('create by parts (type:string, cid:string, commit:string)', () => {
    const type = 'tile'
    const streamid = new CommitID(type, BASE_CID_STRING, BASE_CID_STRING)

    expect(streamid.type).toEqual(0)
    expect(streamid.cid).toEqual(BASE_CID)
    expect(streamid.commit).toEqual(BASE_CID)
    expect(streamid.toString()).toMatchSnapshot()
  })

  test('unknown streamtype name', () => {
    expect(() => new CommitID('invalid-garbage', BASE_CID_STRING, BASE_CID_STRING)).toThrow()
  })
})

describe('#atCommit', () => {
  const commitId = new CommitID('tile', BASE_CID, COMMIT_CID)

  test('to number 0', () => {
    const traveller = commitId.atCommit(0)
    expect(traveller.commit).toEqual(BASE_CID)
  })
  test('to number 1', () => {
    expect(() => commitId.atCommit(1)).toThrowErrorMatchingSnapshot()
  })
  test('to commit CID', () => {
    const commitId = new CommitID('tile', BASE_CID)
    const traveller = commitId.atCommit(COMMIT_CID)
    expect(traveller.commit).toEqual(COMMIT_CID)
  })
  test('to commit CID as string', () => {
    const commitId = new CommitID('tile', BASE_CID)
    const traveller = commitId.atCommit(COMMIT_CID_STRING)
    expect(traveller.commit).toEqual(COMMIT_CID)
  })
  test('to garbage string', () => {
    expect(() => commitId.atCommit('garbage')).toThrow()
  })
})

describe('.fromBytes', () => {
  test('create from stream id bytes: failure', () => {
    expect(() => CommitID.fromBytes(STREAM_ID_BYTES)).toThrow()
  })

  test('invalid stream id', () => {
    expect(() => CommitID.fromBytes(BASE_CID.bytes)).toThrow()
  })

  test('create from bytes inlcuding commit', () => {
    const streamid = CommitID.fromBytes(STREAM_ID_WITH_COMMIT_BYTES)

    expect(streamid.type).toEqual(0)
    expect(streamid.cid).toEqual(BASE_CID)
    expect(streamid.commit).toEqual(COMMIT_CID)
    expect(streamid.toString()).toMatchSnapshot()
  })

  test('create from bytes inlcuding commit 0', () => {
    const streamid = CommitID.fromBytes(STREAM_ID_WITH_0_COMMIT_BYTES)

    expect(streamid.type).toEqual(0)
    expect(streamid.cid).toEqual(BASE_CID)
    expect(streamid.commit).toEqual(BASE_CID)
    expect(streamid.toString()).toMatchSnapshot()
  })

  test('roundtrip streamID bytes', () => {
    const commitId = new CommitID('tile', BASE_CID_STRING)
    const commitId2 = CommitID.fromBytes(commitId.bytes)
    expect(commitId.toString()).toEqual(commitId2.toString())
    expect(commitId.bytes).toEqual(commitId2.bytes)
  })

  test('roundtrip streamID bytes with commit', () => {
    const streamid = new CommitID('tile', BASE_CID_STRING, COMMIT_CID_STRING)
    const streamid2 = CommitID.fromBytes(streamid.bytes)
    expect(streamid.toString()).toEqual(streamid2.toString())
    expect(streamid.bytes).toEqual(streamid2.bytes)
  })

  test('roundtrip streamID bytes with commit', () => {
    const streamid = new CommitID('tile', BASE_CID_STRING, 0)
    const streamid2 = CommitID.fromBytes(streamid.bytes)
    expect(streamid.toString()).toEqual(streamid2.toString())
    expect(streamid.bytes).toEqual(streamid2.bytes)
  })
})

describe('.fromString', () => {
  test('create from stream id string: fail', () => {
    expect(() => CommitID.fromString(STREAM_ID_STRING)).toThrow()
  })

  test('create from string including commit', () => {
    const streamid = CommitID.fromString(STREAM_ID_WITH_COMMIT)

    expect(streamid.type).toEqual(0)
    expect(streamid.cid).toEqual(BASE_CID)
    expect(streamid.commit).toEqual(COMMIT_CID)
    expect(streamid.toString()).toMatchSnapshot()
  })

  test('create from string including commit 0', () => {
    const streamid = CommitID.fromString(STREAM_ID_WITH_0_COMMIT)

    expect(streamid.type).toEqual(0)
    expect(streamid.cid).toEqual(BASE_CID)
    expect(streamid.commit).toEqual(BASE_CID)
    expect(streamid.toString()).toMatchSnapshot()
  })

  test('create from stream id url string: fail', () => {
    expect(() => CommitID.fromString(STREAM_ID_URL)).toThrow()
  })

  test('create from legacy streamid string "/ceramic/": fail', () => {
    expect(() => CommitID.fromString(STREAM_ID_URL_LEGACY))
  })

  test('create from legacy string "/ceramic/" with commit param "?commit="', () => {
    const streamid = CommitID.fromString(STREAM_ID_WITH_COMMIT_LEGACY)

    expect(streamid.type).toEqual(0)
    expect(streamid.cid).toEqual(BASE_CID)
    expect(streamid.commit).toEqual(COMMIT_CID)
    expect(streamid.toString()).toMatchSnapshot()
  })

  test('create from legacy string "/ceramic/" with commit param "?commit=0"', () => {
    const streamid = CommitID.fromString(STREAM_ID_WITH_0_COMMIT_LEGACY)

    expect(streamid.type).toEqual(0)
    expect(streamid.cid).toEqual(BASE_CID)
    expect(streamid.commit).toEqual(BASE_CID)
    expect(streamid.toString()).toMatchSnapshot()
  })

  test('roundtrip streamID string', () => {
    const streamid = new CommitID('tile', BASE_CID_STRING)
    const streamid2 = CommitID.fromString(streamid.toString())
    expect(streamid.toString()).toEqual(streamid2.toString())
  })

  test('roundtrip streamID string with commit', () => {
    const streamid = new CommitID('tile', BASE_CID_STRING, COMMIT_CID_STRING)
    const streamid2 = CommitID.fromString(streamid.toString())
    expect(streamid.toString()).toEqual(streamid2.toString())
  })

  test('roundtrip streamID string with commit 0', () => {
    const streamid = new CommitID('tile', BASE_CID_STRING, 0)
    const streamid2 = CommitID.fromString(streamid.toString())
    expect(streamid.toString()).toEqual(streamid2.toString())
  })
})

test('.bytes', () => {
  const streamid = new CommitID('tile', BASE_CID_STRING)
  const bytes = streamid.bytes
  expect(bytes).toBeDefined()
  expect(bytes instanceof Uint8Array).toEqual(true)
  expect(bytes).toMatchSnapshot()
})

test('.typeName if registered', () => {
  const streamid = new CommitID('tile', BASE_CID_STRING, null)
  expect(streamid.typeName).toEqual('tile')
  const streamid2 = new CommitID(10, BASE_CID_STRING)
  expect(() => streamid2.typeName).toThrowErrorMatchingSnapshot()
})

test('.toString()', () => {
  const streamid = new CommitID('tile', BASE_CID_STRING)
  const str = streamid.toString()
  expect(str).toBeDefined()
  expect(str).toMatchSnapshot()
})

test('.toUrl()', () => {
  const streamid = new CommitID('tile', BASE_CID_STRING)
  const str = streamid.toUrl()
  expect(str).toBeDefined()
  expect(str.includes('ceramic://')).toEqual(true)
  expect(str).toMatchSnapshot()
})

describe('#equals', () => {
  test('equals other streamID', () => {
    const streamid = new CommitID('tile', BASE_CID_STRING)
    const streamid2 = new CommitID('tile', BASE_CID_STRING)
    const streamid3 = new CommitID('caip10-link', BASE_CID_STRING)
    expect(streamid.equals(streamid2)).toEqual(true)
    expect(streamid.equals(streamid3)).toEqual(false)
  })
})

describe('nodejs inspect', () => {
  test('genesis commit', () => {
    const streamid = new CommitID('tile', BASE_CID_STRING)
    expect(util.inspect(streamid)).toMatchSnapshot()
  })
  test('commit', () => {
    const streamid = new CommitID('tile', BASE_CID_STRING, COMMIT_CID_STRING)
    expect(util.inspect(streamid)).toMatchSnapshot()
  })
})

test('to primitive', () => {
  const streamid = new CommitID('tile', BASE_CID_STRING, COMMIT_CID_STRING)
  expect(`${streamid}`).toEqual(streamid.toString())
  expect(+streamid).toBeNaN()
  expect(streamid + '').toEqual(streamid.toString())
})

test('#baseID', () => {
  const commitId = new CommitID('tile', BASE_CID_STRING, COMMIT_CID_STRING)
  const streamId = commitId.baseID
  expect(streamId.type).toEqual(commitId.type)
  expect(streamId.cid).toEqual(commitId.cid)
})

test('instanceof', () => {
  const commitId = new CommitID('tile', BASE_CID_STRING, COMMIT_CID_STRING)
  const instanceSpy = jest.spyOn(CommitID, 'isInstance')
  expect(CommitID.isInstance(commitId)).toBeTruthy()
  expect(instanceSpy).toBeCalledWith(commitId)
})
