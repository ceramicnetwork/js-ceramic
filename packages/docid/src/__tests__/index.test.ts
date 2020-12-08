import DocID from '../index.ts'
import CID from 'cids'

const cidStr = 'bagcqcerakszw2vsovxznyp5gfnpdj4cqm2xiv76yd24wkjewhhykovorwo6a'
const commitCidStr = 'bagjqcgzaday6dzalvmy5ady2m5a5legq5zrbsnlxfc2bfxej532ds7htpova'
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

  it('create by parts (type:int, cid:cid)', async () => {
    const type = 0
    const cid = new CID(cidStr)
    const docid = new DocID(type, cid)

    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(type)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create by parts (type:int, cid:string, commit:null, multibase)', async () => {
    const type = 1
    const multibaseName = 'base32'
    const docid = new DocID(type, cidStr, null, multibaseName)

    expect(docid.multibaseName).toEqual(multibaseName)
    expect(docid.type).toEqual(type)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create by parts (type:string, cid:string, commit:null)', async () => {
    const type = 'tile'
    const docid = new DocID(type, cidStr, null)

    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(0)
    expect(docid._cid.toString()).toEqual(cidStr)
    expect(docid.commit).toBeFalsy()
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create by parts (type:string, cid:string, commit:string)', async () => {
    const type = 'tile'
    const docid = new DocID(type, cidStr, cidStr)

    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(0)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.commit.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from bytes ', async () => {
    const docid = DocID.fromBytes(docIdBytes)

    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(0)
    expect(docid._cid.toString()).toEqual(cidStr)
    expect(docid.commit).toBeFalsy()
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from bytes inlcuding commit', async () => {
    const docid = DocID.fromBytes(docIdBytesCommit)

    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(0)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.commit.toString()).toEqual(commitCidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from bytes inlcuding commit 0', async () => {
    const docid = DocID.fromBytes(docIdBytesCommit0)

    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(0)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.commit.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from bytes with commit', async () => {
    const docid = DocID.fromBytes(docIdBytes, commitCidStr)

    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(0)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.commit.toString()).toEqual(commitCidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from bytes with commit (0) matching cid', async () => {
    const docid = DocID.fromBytes(docIdBytes, cidStr)

    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(0)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.commit.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from bytes with commit 0', async () => {
    const docid = DocID.fromBytes(docIdBytes, '0')

    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(0)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.commit.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from bytes with multibase ', async () => {
    const multibase = 'base32'
    const docid = DocID.fromBytes(docIdBytes, null, multibase)

    expect(docid.multibaseName).toEqual('base32')
    expect(docid.type).toEqual(0)
    expect(docid._cid.toString()).toEqual(cidStr)
    expect(docid.commit).toBeFalsy()
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from string', async () => {
    const docid = DocID.fromString(docIdStr)

    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(0)
    expect(docid._cid.toString()).toEqual(cidStr)
    expect(docid.commit).toBeFalsy()
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from string including commit', async () => {
    const docid = DocID.fromString(docIdStrCommit)

    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(0)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.commit.toString()).toEqual(commitCidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from string including commit 0', async () => {
    const docid = DocID.fromString(docIdStrCommit0)

    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(0)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.commit.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from string with commit', async () => {
    const docid = DocID.fromString(docIdStr, commitCidStr)

    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(0)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.commit.toString()).toEqual(commitCidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from string with commit (0) matching cid', async () => {
    const docid = DocID.fromString(docIdStr, cidStr)

    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(0)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.commit.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from string with commit 0', async () => {
    const docid = DocID.fromString(docIdStr, '0')

    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(0)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.commit.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from string with commit 0 as a number', async () => {
    const docid = DocID.fromString(docIdStr, 0)

    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(0)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.commit.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('Cannot specify commit as a number other than 0', async () => {
    try {
      const docid = DocID.fromString(docIdStr, 1)
      throw new Error("Should not be able to specify commit as a non-zero number")
    } catch (e) {
      expect(e.message).toEqual("Cannot specify commit as a number except to request commit 0 (the genesis commit)")
    }
  })

  it('create from url string', async () => {
    const docid = DocID.fromString(docIdUrl)
    
    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(0)
    expect(docid._cid.toString()).toEqual(cidStr)
    expect(docid.commit).toBeFalsy()
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from legacy string "/ceramic/"', async () => {
    const docid = DocID.fromString(docIdLegacy)
    
    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(0)
    expect(docid._cid.toString()).toEqual(cidStr)
    expect(docid.commit).toBeFalsy()
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from legacy string "/ceramic/" with commit param "?commit="', async () => {
    const docid = DocID.fromString(docIdLegacyCommit)
    
    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(0)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.commit.toString()).toEqual(commitCidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from legacy string "/ceramic/" with commit param "?commit=0"', async () => {
    const docid = DocID.fromString(docIdLegacyCommit0)
    
    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(0)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.commit.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('roundtrip docID string', async () => {
    const docid = new DocID('tile', cidStr)
    const docid2 = DocID.fromString(docid.toString())
    expect(docid.toString()).toEqual(docid2.toString())
  })

  it('roundtrip docID string with commit', async () => {
    const docid = new DocID('tile', cidStr, commitCidStr)
    const docid2 = DocID.fromString(docid.toString())
    expect(docid.toString()).toEqual(docid2.toString())
  })

  it('roundtrip docID string with commit 0', async () => {
    const docid = new DocID('tile', cidStr, 0)
    const docid2 = DocID.fromString(docid.toString())
    expect(docid.toString()).toEqual(docid2.toString())
  })

  it('roundtrip docID bytes', async () => {
    const docid = new DocID('tile', cidStr)
    const docid2 = DocID.fromBytes(docid.bytes)
    expect(docid.toString()).toEqual(docid2.toString())
  })

  it('roundtrip docID bytes with commit', async () => {
    const docid = new DocID('tile', cidStr, commitCidStr)
    const docid2 = DocID.fromBytes(docid.bytes)
    expect(docid.toString()).toEqual(docid2.toString())
  })

  it('roundtrip docID bytes with commit', async () => {
    const docid = new DocID('tile', cidStr, 0)
    const docid2 = DocID.fromBytes(docid.bytes)
    expect(docid.toString()).toEqual(docid2.toString())
  })

  it('roundtrip .toString(base)', async () => {
    const docid = new DocID('tile', cidStr, 0, 'base58btc')
    const docid2 = DocID.fromString(docid.toString('base32'))
    expect(docid.toString('base32')).toEqual(docid2.toString())
  })

  it('.bytes', async () => {
    const docid = new DocID('tile', cidStr)
    const bytes = docid.bytes
    expect(bytes).toBeDefined()
    expect(bytes instanceof Uint8Array).toEqual(true)
    expect(bytes).toMatchSnapshot()
  })

  it('.typeName if registered', async () => {
    const docid = new DocID('tile', cidStr, null, 'devnet')
    expect(docid.typeName).toEqual('tile')
    const docid2 = new DocID(10, cidStr)
    expect(() => docid2.typeName).toThrowErrorMatchingSnapshot()
  })

  it('.toString()', async () => {
    const docid = new DocID('tile', cidStr)
    const str = docid.toString()
    expect(str).toBeDefined()
    expect(str).toMatchSnapshot()
  })

  it('.toString(base)', async () => {
    const docid = new DocID('tile', cidStr)
    const str = docid.toString('base58btc')
    expect(str).toBeDefined()
    expect(str).toMatchSnapshot()
    expect(docid.toString('base32')).not.toEqual(str)
  })

  it('.toUrl()', async () => {
    const docid = new DocID('tile', cidStr)
    const str = docid.toUrl()
    expect(str).toBeDefined()
    expect(str.includes('ceramic://')).toEqual(true)
    expect(str).toMatchSnapshot()
  })

  it('equals other DocID', async () => {
    const docid = new DocID('tile', cidStr)
    const docid2 = new DocID('tile', cidStr)
    const docid3 = new DocID('caip10-link', cidStr)
    expect(docid.equals(docid2)).toEqual(true)
    expect(docid.equals(docid3)).toEqual(false)
  })

  it('equals other DocID bytes', async () => {
    const docid = new DocID('tile', cidStr)
    const docid2 = new DocID('tile', cidStr)
    const docid3 = new DocID('caip10-link', cidStr)
    expect(docid.equals(docid2.bytes)).toEqual(true)
    expect(docid.equals(docid3.bytes)).toEqual(false)
  })

  it('equals other DocID string', async () => {
    const docid = new DocID('tile', cidStr)
    const docid2 = new DocID('tile', cidStr)
    const docid3 = new DocID('caip10-link', cidStr)
    expect(docid.equals(docid2.toString())).toEqual(true)
    expect(docid.equals(docid3.toString())).toEqual(false)
  })

  it('equals other DocID string with commit 0', async () => {
    // The first three docids should be equal and explicitly have the genesis CID as the commit
    const docid = new DocID('tile', cidStr, 0)
    const docid2 = new DocID('tile', cidStr, '0')
    const docid3 = new DocID('tile', cidStr, cidStr)
    // docid4 won't equal the rest because it will omit the commit entirely
    const docid4 = new DocID('tile', cidStr)
    expect(docid.equals(docid2.toString())).toEqual(true)
    expect(docid.equals(docid3.toString())).toEqual(true)
    expect(docid.equals(docid4.toString())).toEqual(false)
  })

  it('equals other DocID with commit', async () => {
    const docid = new DocID('tile', cidStr, commitCidStr)
    const docid2 = new DocID('tile', cidStr, commitCidStr)
    const docid3 = new DocID('caip10-link', cidStr, 0)
    expect(docid.equals(docid2)).toEqual(true)
    expect(docid.equals(docid3)).toEqual(false)
  })

  it('equals other DocID bytes with commit', async () => {
    const docid = new DocID('tile', cidStr, commitCidStr)
    const docid2 = new DocID('tile', cidStr, commitCidStr)
    const docid3 = new DocID('caip10-link', cidStr, 0)
    expect(docid.equals(docid2.bytes)).toEqual(true)
    expect(docid.equals(docid3.bytes)).toEqual(false)
  })

  it('equals other DocID string with verion', async () => {
    const docid = new DocID('tile', cidStr, commitCidStr)
    const docid2 = new DocID('tile', cidStr, commitCidStr)
    const docid3 = new DocID('caip10-link', cidStr, 0)
    expect(docid.equals(docid2.toString())).toEqual(true)
    expect(docid.equals(docid3.toString())).toEqual(false)
  })

  it('equals other DocID string (base)', async () => {
    const docid = new DocID('tile', cidStr)
    const docid2 = new DocID('tile', cidStr)
    const docid3 = new DocID('caip10-link', cidStr)
    expect(docid.equals(docid2.toString('base32'))).toEqual(true)
    expect(docid.equals(docid3.toString('base32'))).toEqual(false)
  })

  it('base DocID equals with different commits', async () => {
    const docid = new DocID('tile', cidStr, commitCidStr)
    const docid2 = new DocID('tile', cidStr, commitCidStr)
    const docid3 = new DocID('tile', cidStr, 0)
    expect(docid.baseID.equals(docid2.baseID)).toEqual(true)
    expect(docid.baseID.equals(docid3.baseID)).toEqual(true)
    expect(docid.baseID.equals(docid2.baseID.toString())).toEqual(true)
    expect(docid.baseID.equals(docid3.baseID.toString())).toEqual(true)
  })

  it('valid docID instance', async () => {
    const docid = new DocID('tile', cidStr)
    expect(DocID.isDocID(docid)).toEqual(true)
  })

  it('valid docID bytes', async () => {
    expect(DocID.isDocID(docIdBytes)).toEqual(true)
    expect(DocID.isDocID(docIdBytes.slice(2))).toEqual(false)
  })

  it('valid docID string', async () => {
    expect(DocID.isDocID(docIdStr)).toEqual(true)
    expect(DocID.isDocID(docIdStr.slice(2))).toEqual(false)
    expect(DocID.isDocID(docIdStr.slice(-2))).toEqual(false)
  })
})