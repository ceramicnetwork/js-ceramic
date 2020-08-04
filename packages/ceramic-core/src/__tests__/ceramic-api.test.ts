import Ceramic from '../ceramic'
import IdentityWallet from 'identity-wallet'
import tmp from 'tmp-promise'
import Ipfs from 'ipfs'
import { TileDoctype, TileParams } from "@ceramicnetwork/ceramic-doctype-tile"
import { DoctypeUtils, AnchorStatus } from "@ceramicnetwork/ceramic-common"

jest.mock('../store/level-state-store')

const seed = '0x5872d6e0ae7347b72c9216db218ebbb9d9d0ae7ab818ead3557e8e78bf944184'

describe('Ceramic API', () => {
  jest.setTimeout(15000)
  let ipfs: Ipfs;
  let tmpFolder: any;
  let idWallet: IdentityWallet;

  const DOCTYPE_TILE = 'tile'

  const stringMapSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "StringMap",
    "type": "object",
    "additionalProperties": {
      "type": "string"
    }
  }

  beforeAll(async () => {
    idWallet = new IdentityWallet(() => true, { seed })
    tmpFolder = await tmp.dir({ unsafeCleanup: true })
    ipfs = await Ipfs.create({
      repo: `${tmpFolder.path}/ipfs9/`,
      config: {
        Addresses: { Swarm: [ `/ip4/127.0.0.1/tcp/4009` ] },
        Bootstrap: []
      },
    })
  })

  afterAll(async () => {
    await ipfs.stop()
    await tmpFolder.cleanup()
  })

  it('can load the previous document version', async () => {
    const ceramic = await Ceramic.create(ipfs)
    await ceramic.setDIDProvider(idWallet.get3idProvider())
    const owner = ceramic.context.user.publicKeys.managementKey

    const docOg = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, { content: { test: 321 }, metadata: { owners: [owner] } })

    // wait for anchor (new version)
    await new Promise(resolve => {
      docOg.on('change', () => {
        resolve()
      })
    })

    expect(docOg.state.log.length).toEqual(2)
    expect(docOg.content).toEqual({ test: 321 })
    expect(docOg.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

    const stateOg = docOg.state

    await docOg.change({ content: { test: 'abcde' } })

    // wait for anchor (new version)
    await new Promise(resolve => {
      docOg.on('change', () => {
        resolve()
      })
    })

    expect(docOg.state.log.length).toEqual(4)
    expect(docOg.content).toEqual({ test: 'abcde' })
    expect(docOg.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

    let docV0Id = DoctypeUtils.createDocIdFromBase(docOg.id, docOg.state.log[1].toString())
    const docV0 = await ceramic.loadDocument<TileDoctype>(docV0Id)

    expect(docV0.state).toEqual(stateOg)
    expect(docV0.content).toEqual({ test: 321 })
    expect(docV0.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

    // try to call doctype.change
    try {
      await docV0.change({ content: { test: 'fghj' }, metadata: { owners: docV0.owners } })
      throw new Error('Should not be able to update version')
    } catch (e) {
      expect(e.message).toEqual('The version of the document is readonly. Checkout the latest HEAD in order to update.')
    }

    // try to call Ceramic API directly
    try {
      const updateRecord = await TileDoctype._makeRecord(docV0, ceramic.context.user, { content: { test: 'fghj' } })
      await ceramic.context.api.applyRecord(docV0Id, updateRecord)
      throw new Error('Should not be able to update version')
    } catch (e) {
      expect(e.message).toEqual('The version of the document is readonly. Checkout the latest HEAD in order to update.')
    }

    // try to checkout not anchored version
    try {
      docV0Id = DoctypeUtils.createDocIdFromBase(docOg.id, docOg.state.log[2].toString())
      await ceramic.loadDocument<TileDoctype>(docV0Id)
      throw new Error('Should not be able to fetch not anchored version')
    } catch (e) {
      expect(e.message).toContain('No anchor record for version')
    }

    await ceramic.close()
  })

  it('cannot create document with invalid schema', async () => {
    const ceramic = await Ceramic.create(ipfs)
    await ceramic.setDIDProvider(idWallet.get3idProvider())
    const owner = ceramic.context.user.publicKeys.managementKey

    const schemaDoc = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, { content: stringMapSchema, metadata: { owners: [owner] }})

    const tileDocParams: TileParams = {
      metadata: {
        schema: schemaDoc.id,
        owners: [owner]
      },
      content: { a: 1 },
    }

    try {
      await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, tileDocParams)
      throw new Error('Should not be able to create an invalid document')
    } catch (e) {
      expect(e.message).toEqual('Validation Error: data[\'a\'] should be string')
    }

    await ceramic.close()
  })

  it('can create document with valid schema', async () => {
    const ceramic = await Ceramic.create(ipfs)
    await ceramic.setDIDProvider(idWallet.get3idProvider())
    const owner = ceramic.context.user.publicKeys.managementKey

    const schemaDoc = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, { content: stringMapSchema, metadata: { owners: [owner] }})

    const tileDocParams: TileParams = {
      metadata: {
        schema: schemaDoc.id,
        owners: [owner]
      },
      content: { a: "test" }
    }

    await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, tileDocParams)

    await new Promise(resolve => setTimeout(resolve, 1000)) // wait to propagate
    await ceramic.close()
  })

  it('can create document with invalid schema if validation is not set', async () => {
    const ceramic = await Ceramic.create(ipfs, { validateDocs: false })
    await ceramic.setDIDProvider(idWallet.get3idProvider())
    const owner = ceramic.context.user.publicKeys.managementKey

    const schemaDoc = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, { content: stringMapSchema, metadata: { owners: [owner] }})

    const tileDocParams: TileParams = {
      metadata: {
        schema: schemaDoc.id,
        owners: [owner]
      },
      content: { a: 1 },
    }

    await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, tileDocParams)

    await new Promise(resolve => setTimeout(resolve, 1000)) // wait to propagate
    await ceramic.close()
  })

  it('can update schema if content is valid', async () => {
    const ceramic = await Ceramic.create(ipfs)
    await ceramic.setDIDProvider(idWallet.get3idProvider())
    const owner = ceramic.context.user.publicKeys.managementKey

    const tileDocParams: TileParams = {
      metadata: {
        owners: [owner]
      },
      content: { a: 'x' },
    }

    const doctype = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, tileDocParams)
    const schemaDoc = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, {
      content: stringMapSchema,
      metadata: {
        owners: [owner]
      }
    })

    await doctype.change({
      metadata: {
        owners: [owner], schema: schemaDoc.id
      }
    })

    expect(doctype.content).toEqual({ a: 'x' })

    await new Promise(resolve => setTimeout(resolve, 1000)) // wait to propagate
    await ceramic.close()
  })

  it('cannot update schema if content is not valid', async () => {
    const ceramic = await Ceramic.create(ipfs)
    await ceramic.setDIDProvider(idWallet.get3idProvider())
    const owner = ceramic.context.user.publicKeys.managementKey

    const tileDocParams: TileParams = {
      metadata: {
        owners: [owner]
      },
      content: { a: 1 },
    }

    const docType = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, tileDocParams)
    const schemaDoc = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, {
      content: stringMapSchema,
      metadata: {
        owners: [owner]
      }
    })

    try {
      await docType.change({
        metadata: {
          owners: [owner],
          schema: schemaDoc.id
        }
      })
      throw new Error('Should not be able to update the document with invalid content')
    } catch (e) {
      expect(e.message).toEqual('Validation Error: data[\'a\'] should be string')
    }

    await ceramic.close()
  })
})
