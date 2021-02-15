import { DocID } from '../doc-id';
import CID from 'cids'

const cidStr = 'bagcqcerakszw2vsovxznyp5gfnpdj4cqm2xiv76yd24wkjewhhykovorwo6a'
const docIdStr = 'kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s'
const docIdUrl = 'ceramic://kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s'
const docIdLegacy = '/ceramic/kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s'

const docIdStrCommit = 'k1dpgaqe3i64kjqcp801r3sn7ysi5i0k7nxvs7j351s7kewfzr3l7mdxnj7szwo4kr9mn2qki5nnj0cv836ythy1t1gya9s25cn1nexst3jxi5o3h6qprfyju'
const docIdStrCommit0 = 'k3y52l7qbv1frxwipl4hp7e6jlu4f6u8upm2xv0irmedfkm5cnutmezzi3u7mytj4'
const docIdLegacyCommit = '/ceramic/kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s?commit=bagjqcgzaday6dzalvmy5ady2m5a5legq5zrbsnlxfc2bfxej532ds7htpova'
const docIdLegacyCommit0 = '/ceramic/kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s?commit=0'

const docIdBytes = new Uint8Array([
  206,   1,   0,   1, 133,   1,  18,  32,  84,
179, 109,  86,  78, 173, 242, 220,  63, 166,
 43,  94,  52, 240,  80, 102, 174, 138, 255,
216,  30, 185, 101,  36, 150,  57, 240, 167,
 85, 209, 179, 188
])

const docIdBytesCommit = new Uint8Array([
  206,   1,   0,   1, 133,   1,  18,  32,  84, 179, 109,  86,
   78, 173, 242, 220,  63, 166,  43,  94,  52, 240,  80, 102,
  174, 138, 255, 216,  30, 185, 101,  36, 150,  57, 240, 167,
   85, 209, 179, 188,   1, 147,   1,  27,  32,  24,  49, 225,
  228,  11, 171,  49, 208,  15,  26, 103,  65, 213, 144, 208,
  238,  98,  25,  53, 119,  40, 180,  18, 220, 137, 238, 244,
   57, 124, 243, 123, 170
])

const docIdBytesCommit0 = new Uint8Array([
  206,   1,   0,   1, 133,   1,  18,  32,  84,
  179, 109,  86,  78, 173, 242, 220,  63, 166,
   43,  94,  52, 240,  80, 102, 174, 138, 255,
  216,  30, 185, 101,  36, 150,  57, 240, 167,
   85, 209, 179, 188,   0
])

describe('DocID', () => {

  it('create by parts (type:int, cid:cid)',  () => {
    const type = 0
    const cid = new CID(cidStr)
    const docid = new DocID(type, cid)

    expect(docid.type).toEqual(type)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from bytes ',  () => {
    const docid = DocID.fromBytes(docIdBytes)

    expect(docid.type).toEqual(0)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from bytes inlcuding commit',  () => {
    const docid = DocID.fromBytes(docIdBytesCommit)

    expect(docid.type).toEqual(0)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from bytes inlcuding commit 0',  () => {
    const docid = DocID.fromBytes(docIdBytesCommit0)

    expect(docid.type).toEqual(0)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from string',  () => {
    const docid = DocID.fromString(docIdStr)

    expect(docid.type).toEqual(0)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from string including commit',  () => {
    const docid = DocID.fromString(docIdStrCommit)

    expect(docid.type).toEqual(0)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from string including commit 0',  () => {
    const docid = DocID.fromString(docIdStrCommit0)

    expect(docid.type).toEqual(0)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from url string',  () => {
    const docid = DocID.fromString(docIdUrl)

    expect(docid.type).toEqual(0)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from legacy string "/ceramic/"',  () => {
    const docid = DocID.fromString(docIdLegacy)

    expect(docid.type).toEqual(0)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from legacy string "/ceramic/" with commit param "?commit="',  () => {
    const docid = DocID.fromString(docIdLegacyCommit)

    expect(docid.type).toEqual(0)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from legacy string "/ceramic/" with commit param "?commit=0"',  () => {
    const docid = DocID.fromString(docIdLegacyCommit0)

    expect(docid.type).toEqual(0)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('roundtrip docID string',  () => {
    const docid = new DocID('tile', cidStr)
    const docid2 = DocID.fromString(docid.toString())
    expect(docid.toString()).toEqual(docid2.toString())
  })

  it('roundtrip docID bytes',  () => {
    const docid = new DocID('tile', cidStr)
    const docid2 = DocID.fromBytes(docid.bytes)
    expect(docid.toString()).toEqual(docid2.toString())
  })

  it('.bytes',  () => {
    const docid = new DocID('tile', cidStr)
    const bytes = docid.bytes
    expect(bytes).toBeDefined()
    expect(bytes instanceof Uint8Array).toEqual(true)
    expect(bytes).toMatchSnapshot()
  })

  it('.typeName if registered',  () => {
    const docid = new DocID('tile', cidStr)
    expect(docid.typeName).toEqual('tile')
    const docid2 = new DocID(10, cidStr)
    expect(() => docid2.typeName).toThrowErrorMatchingSnapshot()
  })

  it('.toString()',  () => {
    const docid = new DocID('tile', cidStr)
    const str = docid.toString()
    expect(str).toBeDefined()
    expect(str).toMatchSnapshot()
  })

  it('.toUrl()',  () => {
    const docid = new DocID('tile', cidStr)
    const str = docid.toUrl()
    expect(str).toBeDefined()
    expect(str.includes('ceramic://')).toEqual(true)
    expect(str).toMatchSnapshot()
  })

  it('equals other DocID',  () => {
    const docid = new DocID('tile', cidStr)
    const docid2 = new DocID('tile', cidStr)
    const docid3 = new DocID('caip10-link', cidStr)
    expect(docid.equals(docid2)).toEqual(true)
    expect(docid.equals(docid3)).toEqual(false)
  })
})
