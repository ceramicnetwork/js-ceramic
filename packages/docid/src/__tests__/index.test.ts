import DocID from '../index.ts'
import CID from 'cids'

const cidStr = 'bagcqcerakszw2vsovxznyp5gfnpdj4cqm2xiv76yd24wkjewhhykovorwo6a'
const docIdStr = 'k3y52l7mkcvtg023bt9txegccxe1bah8os3naw5asin3baf3l3t54atn0cuy98yws'
const docIdStrVersion = 'k9tgzwbevycbwc8nc6ta08vm7wmdhcwpomm34zughq8gmliunxy25lior3npdspknkf4lb5ngvkz0io0fvv9fq953bu0lkwobcckhuo00lo5p503kdqyz4a118'
const docIdUrl = 'ceramic://k3y52l7mkcvtg023bt9txegccxe1bah8os3naw5asin3baf3l3t54atn0cuy98yws'
const docIdLegacy = '/ceramic/k3y52l7mkcvtg023bt9txegccxe1bah8os3naw5asin3baf3l3t54atn0cuy98yws'
const docIdLegacyVersion = '/ceramic/k3y52l7mkcvtg023bt9txegccxe1bah8os3naw5asin3baf3l3t54atn0cuy98yws?version=bagcqcerakszw2vsovxznyp5gfnpdj4cqm2xiv76yd24wkjewhhykovorwo6a'
const docIdBytes = new Uint8Array([
  206,   1,   0,   0,   1, 133,   1,  18,  32,
   84, 179, 109,  86,  78, 173, 242, 220,  63,
  166,  43,  94,  52, 240,  80, 102, 174, 138,
  255, 216,  30, 185, 101,  36, 150,  57, 240,
  167,  85, 209, 179, 188
])

const docIdBytesVersion = new Uint8Array([
  206,   1,   0,   0,   1, 133,   1,  18,  32,  84, 179, 109,
  86,  78, 173, 242, 220,  63, 166,  43,  94,  52, 240,  80,
 102, 174, 138, 255, 216,  30, 185, 101,  36, 150,  57, 240,
 167,  85, 209, 179, 188,   1, 133,   1,  18,  32,  84, 179,
 109,  86,  78, 173, 242, 220,  63, 166,  43,  94,  52, 240,
  80, 102, 174, 138, 255, 216,  30, 185, 101,  36, 150,  57,
 240, 167,  85, 209, 179, 188
])

describe('DocID', () => {

  it('create by parts (type:int, cid:cid)', async () => {
    const type = 0
    const cid = new CID(cidStr)
    const docid = new DocID(type, cid)

    expect(docid.subnet).toEqual(0)
    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(type)
    expect(docid._cid.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create by parts (type:int, cid:string, version:null, subnet:int, multibase)', async () => {
    const type = 1
    const subnet = 1
    const multibaseName = 'base32'
    const docid = new DocID(type, cidStr, null, subnet, multibaseName)

    expect(docid.subnet).toEqual(subnet)
    expect(docid.multibaseName).toEqual(multibaseName)
    expect(docid.type).toEqual(type)
    expect(docid._cid.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create by parts (type:string, cid:string, version:null, subnet:string)', async () => {
    const type = 'tile'
    const subnet = 'devnet'
    const docid = new DocID(type, cidStr, null, subnet)

    expect(docid.subnet).toEqual(0)
    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(0)
    expect(docid._cid.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create by parts (type:string, cid:string, version:string)', async () => {
    const type = 'tile'
    const docid = new DocID(type, cidStr, cidStr)

    expect(docid.subnet).toEqual(0)
    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(0)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.version.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from bytes ', async () => {
    const docid = DocID.fromBytes(docIdBytes)

    expect(docid.subnet).toEqual(0)
    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(0)
    expect(docid._cid.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from bytes inlcuding version', async () => {
    const docid = DocID.fromBytes(docIdBytesVersion)

    expect(docid.subnet).toEqual(0)
    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(0)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.version.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from bytes with version', async () => {
    const docid = DocID.fromBytes(docIdBytes, cidStr)

    expect(docid.subnet).toEqual(0)
    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(0)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.version.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from bytes with multibase ', async () => {
    const multibase = 'base32'
    const docid = DocID.fromBytes(docIdBytes, null, multibase)

    expect(docid.subnet).toEqual(0)
    expect(docid.multibaseName).toEqual('base32')
    expect(docid.type).toEqual(0)
    expect(docid._cid.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from string', async () => {
    const docid = DocID.fromString(docIdStr)

    expect(docid.subnet).toEqual(0)
    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(0)
    expect(docid._cid.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from string including version', async () => {
    const docid = DocID.fromString(docIdStrVersion)

    expect(docid.subnet).toEqual(0)
    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(0)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.version.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from string with version', async () => {
    const docid = DocID.fromString(docIdStr, cidStr)

    expect(docid.subnet).toEqual(0)
    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(0)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.version.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from url string', async () => {
    const docid = DocID.fromString(docIdUrl)
    
    expect(docid.subnet).toEqual(0)
    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(0)
    expect(docid._cid.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from legacy string "/ceramic/"', async () => {
    const docid = DocID.fromString(docIdLegacy)
    
    expect(docid.subnet).toEqual(0)
    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(0)
    expect(docid._cid.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('create from legacy string "/ceramic/" with version param "?version="', async () => {
    const docid = DocID.fromString(docIdLegacyVersion)
    
    expect(docid.subnet).toEqual(0)
    expect(docid.multibaseName).toEqual('base36')
    expect(docid.type).toEqual(0)
    expect(docid.cid.toString()).toEqual(cidStr)
    expect(docid.version.toString()).toEqual(cidStr)
    expect(docid.toString()).toMatchSnapshot()
  })

  it('roundtrip docID string', async () => {
    const docid = new DocID('tile', cidStr)
    const docid2 = DocID.fromString(docid.toString())
    expect(docid.toString()).toEqual(docid2.toString())
  })

  it('roundtrip docID string with version', async () => {
    const docid = new DocID('tile', cidStr, cidStr)
    const docid2 = DocID.fromString(docid.toString())
    expect(docid.toString()).toEqual(docid2.toString())
  })

  it('roundtrip docID bytes', async () => {
    const docid = new DocID('tile', cidStr)
    const docid2 = DocID.fromBytes(docid.bytes)
    expect(docid.toString()).toEqual(docid2.toString())
  })

  it('roundtrip docID bytes with version', async () => {
    const docid = new DocID('tile', cidStr, cidStr)
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

  it('.subnetName if registered', () => {
    const docid = new DocID('tile', cidStr, null, 'devnet')
    expect(docid.subnetName).toEqual('devnet')
    const docid2 = new DocID('tile', cidStr, null, 10)
    expect(() => docid2.subnetName).toThrowErrorMatchingSnapshot()
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

  it('equals other DocID string (base)', async () => {
    const docid = new DocID('tile', cidStr)
    const docid2 = new DocID('tile', cidStr)
    const docid3 = new DocID('caip10-link', cidStr)
    expect(docid.equals(docid2.toString('base32'))).toEqual(true)
    expect(docid.equals(docid3.toString('base32'))).toEqual(false)
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