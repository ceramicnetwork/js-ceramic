import CID from 'cids'

import { Resolver } from "did-resolver"

import dagCBOR from "ipld-dag-cbor"

import KeyDidResolver from 'key-did-resolver'
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'

import { DID } from 'dids'

import {AnchorCommit, CeramicApi, Context, SignedCommitContainer} from "@ceramicnetwork/common"
import { TileDoctypeHandler } from "../tile-doctype-handler"
import { TileDoctype } from "../tile-doctype"
jest.mock('did-jwt', () => ({
  // TODO - We should test for when this function throws as well
  verifyJWS: (): void => { return }
}))

const cloneDeep = require('lodash.clonedeep') // eslint-disable-line @typescript-eslint/no-var-requires
const { sha256 } = require('js-sha256') // eslint-disable-line @typescript-eslint/no-var-requires
const hash = (data: string): CID => new CID(1, 'sha2-256', Buffer.from('1220' + sha256(data), 'hex'))

const FAKE_CID_1 = new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_2 = new CID('bafybeig6xv5nwphfmvcnektpnojts44jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_3 = new CID('bafybeig6xv5nwphfmvcnektpnojts55jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_4 = new CID('bafybeig6xv5nwphfmvcnektpnojts66jqcuam7bmye2pb54adnrtccjlsu')

const COMMITS = {
  genesis: { header: { tags: ['3id'], controllers: [ 'did:key:zQ3shwsCgFanBax6UiaLu1oGvM7vhuqoW88VBUiUTCeHbTeTV' ] }, data: { publicKeys: { test: '0xabc' } } },
  genesisGenerated: {
    jws: {
      payload: "bbbb",
      signatures: [
        {
          protected: "eyJraWQiOiJkaWQ6a2V5OnpRM3Nod3NDZ0ZhbkJheDZVaWFMdTFvR3ZNN3ZodXFvVzg4VkJVaVVUQ2VIYlRlVFYiLCJhbGciOiJFUzI1NksifQ",
          signature: "cccc"
        }
      ],
      link: new CID("bafyreia4yhrqevqys35mvccnfmgcrpne6fxrdpqaonif7njq3gh7so633e")
    },
    linkedBlock: {
      data: {
          publicKeys: {
            test: "0xabc",
          },
      },
      header: {
        controllers: [
          "did:key:zQ3shwsCgFanBax6UiaLu1oGvM7vhuqoW88VBUiUTCeHbTeTV"
        ],
        "tags": [
          "3id",
        ]
      },
      unique: "0",
    }
  },
  r1: {
    desiredContent: { publicKeys: { test: '0xabc' }, other: 'data' },
    commit: {
      jws: {
        "payload": "bbbb",
        "signatures": [
          {
            "protected": "eyJraWQiOiJkaWQ6a2V5OnpRM3Nod3NDZ0ZhbkJheDZVaWFMdTFvR3ZNN3ZodXFvVzg4VkJVaVVUQ2VIYlRlVFYiLCJhbGciOiJFUzI1NksifQ",
            "signature": "cccc"
          }
        ],
        "link": "bafyreib2rxk3rybk3aobmv5cjuql3bm2twh4jo5uxgf5kpqcsgz7soitae"
      },
      payload: {
        "id": "bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu",
        "data": [
          {
            "op": "add",
            "path": "/other",
            "value": "data"
          }
        ],
        "prev": "bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu",
        "header": {},
      }
    }
  },
  r2: { commit: { proof: FAKE_CID_4 } },
  proof: {
    blockNumber: 123456,
    chainId: 'fakechain:123',
  }
}

const serialize = (data: any): any => {
  if (Array.isArray(data)) {
    const serialized = []
    for (const item of data) {
      serialized.push(serialize(item))
    }
    return serialized
  }
  if (!CID.isCID(data) && typeof data === "object") {
    const serialized: Record<string, any> = {}
    for (const prop in data) {
      serialized[prop] = serialize(data[prop])
    }
    return serialized
  }
  if (CID.isCID(data)) {
    return data.toString()
  }
  return data
}

describe('ThreeIdHandler', () => {
  let did: DID
  let tileDoctypeHandler: TileDoctypeHandler
  let context: Context

  beforeAll(() => {
    did = new DID()
    did.createJWS = jest.fn(async () => {
      // fake jws
      return { payload: 'bbbb', signatures: [{ protected: 'eyJraWQiOiJkaWQ6a2V5OnpRM3Nod3NDZ0ZhbkJheDZVaWFMdTFvR3ZNN3ZodXFvVzg4VkJVaVVUQ2VIYlRlVFYiLCJhbGciOiJFUzI1NksifQ', signature: 'cccc'}]}
    })
    did._id = 'did:key:zQ3shwsCgFanBax6UiaLu1oGvM7vhuqoW88VBUiUTCeHbTeTV'

    const recs: Record<string, any> = {}
    const ipfs = {
      dag: {
        put(rec: any, cid?: CID): any {
          if (cid) {
            recs[cid.toString()] = { value: rec }
            return cid
          }
          // stringify as a way of doing deep copy
          const clone = cloneDeep(rec)
          const c = hash(JSON.stringify(clone))
          recs[c.toString()] = { value: clone }
          return c
        },
        get(cid: any): any {
          return recs[cid.toString()]
        }
      }
    }

    const threeIdResolver = ThreeIdResolver.getResolver({
      loadDocument: (): any => {
        return Promise.resolve({
          content: {
            "publicKeys": {
              "signing": "zQ3shwsCgFanBax6UiaLu1oGvM7vhuqoW88VBUiUTCeHbTeTV",
              "encryption": "z6LSfQabSbJzX8WAm1qdQcHCHTzVv8a2u6F7kmzdodfvUCo9"
            }
          }
        })
      },
      createDocument: (): any => { return null },
    })

    const api = { getSupportedChains: jest.fn(async () => {return ["fakechain:123"]}) }
    const keyDidResolver = KeyDidResolver.getResolver()
    context = {
      did,
      ipfs,
      resolver: new Resolver({
        ...threeIdResolver, ...keyDidResolver
      }),
      anchorService: null,
      api: api as unknown as CeramicApi,
    }
  })

  beforeEach(() => {
    tileDoctypeHandler = new TileDoctypeHandler()
  })

  it('is constructed correctly', async () => {
    expect(tileDoctypeHandler.name).toEqual('tile')
  })

  it('makes genesis commit correctly', async () => {
    const commit = await TileDoctype.makeGenesis({ content: COMMITS.genesis.data, metadata: COMMITS.genesis.header, deterministic:true }, context) as SignedCommitContainer
    const { jws, linkedBlock } = commit

    const payload = dagCBOR.util.deserialize(linkedBlock)
    const generated = { jws: serialize(jws), linkedBlock: serialize(payload)}
    expect(generated).toEqual(serialize(COMMITS.genesisGenerated))
  })

  it('applies genesis commit correctly', async () => {
    const tileHandler = new TileDoctypeHandler()

    const commit = await TileDoctype.makeGenesis({ content: COMMITS.genesis.data, metadata: { controllers: [did.id], tags: ['3id'] } }, context) as SignedCommitContainer
    await context.ipfs.dag.put(commit, FAKE_CID_1)

    const payload = dagCBOR.util.deserialize(commit.linkedBlock)
    await context.ipfs.dag.put(payload, commit.jws.link)

    const docState = await tileHandler.applyCommit(commit.jws, FAKE_CID_1, context)
    expect(docState).toMatchSnapshot()
  })

  it('makes signed commit correctly', async () => {
    const tileDoctypeHandler = new TileDoctypeHandler()

    await context.ipfs.dag.put(COMMITS.genesisGenerated.jws, FAKE_CID_1)
    await context.ipfs.dag.put(COMMITS.genesisGenerated.linkedBlock, COMMITS.genesisGenerated.jws.link)

    const state = await tileDoctypeHandler.applyCommit(COMMITS.genesisGenerated.jws, FAKE_CID_1, context)
    const doctype = new TileDoctype(state, context)

    await expect(TileDoctype._makeCommit(doctype, null, COMMITS.r1.desiredContent)).rejects.toThrow(/No DID/)

    const commit = await TileDoctype._makeCommit(doctype, did, COMMITS.r1.desiredContent) as SignedCommitContainer
    const { jws: rJws, linkedBlock: rLinkedBlock} = commit
    const rPayload = dagCBOR.util.deserialize(rLinkedBlock)
    expect({ jws: serialize(rJws), payload: serialize(rPayload)}).toEqual(COMMITS.r1.commit)
  })

  it('applies signed commit correctly', async () => {
    const tileDoctypeHandler = new TileDoctypeHandler()

    const genesisCommit = await TileDoctype.makeGenesis({ content: COMMITS.genesis.data, metadata: { controllers: [did.id], tags: ['3id'] } }, context) as SignedCommitContainer
    await context.ipfs.dag.put(genesisCommit, FAKE_CID_1)

    const payload = dagCBOR.util.deserialize(genesisCommit.linkedBlock)
    await context.ipfs.dag.put(payload, genesisCommit.jws.link)

    // apply genesis
    let state = await tileDoctypeHandler.applyCommit(genesisCommit.jws, FAKE_CID_1, context)

    const doctype = new TileDoctype(state, context)
    const signedCommit = await TileDoctype._makeCommit(doctype, did, COMMITS.r1.desiredContent) as SignedCommitContainer

    await context.ipfs.dag.put(signedCommit, FAKE_CID_2)

    const sPayload = dagCBOR.util.deserialize(signedCommit.linkedBlock)
    await context.ipfs.dag.put(sPayload, signedCommit.jws.link)

    // apply signed
    state = await tileDoctypeHandler.applyCommit(signedCommit.jws, FAKE_CID_2, context, state)
    expect(state).toMatchSnapshot()
  })

  it('throws error if commit signed by wrong DID', async () => {
    const tileDoctypeHandler = new TileDoctypeHandler()

    const genesisCommit = await TileDoctype.makeGenesis({ content: COMMITS.genesis.data, metadata: { controllers: ['did:3:fake'], tags: ['3id'] } }, context) as SignedCommitContainer
    await context.ipfs.dag.put(genesisCommit, FAKE_CID_1)

    const payload = dagCBOR.util.deserialize(genesisCommit.linkedBlock)
    await context.ipfs.dag.put(payload, genesisCommit.jws.link)

    await expect(tileDoctypeHandler.applyCommit(genesisCommit.jws, FAKE_CID_1, context)).rejects.toThrow(/wrong DID/)
  })

  it('applies anchor commit correctly', async () => {
    const tileDoctypeHandler = new TileDoctypeHandler()

    const genesisCommit = await TileDoctype.makeGenesis({ content: COMMITS.genesis.data, metadata: { controllers: [did.id], tags: ['3id'] } }, context) as SignedCommitContainer
    await context.ipfs.dag.put(genesisCommit, FAKE_CID_1)

    const payload = dagCBOR.util.deserialize(genesisCommit.linkedBlock)
    await context.ipfs.dag.put(payload, genesisCommit.jws.link)

    // apply genesis
    let state = await tileDoctypeHandler.applyCommit(genesisCommit.jws, FAKE_CID_1, context)

    const doctype = new TileDoctype(state, context)
    const signedCommit = await TileDoctype._makeCommit(doctype, did, COMMITS.r1.desiredContent) as SignedCommitContainer

    await context.ipfs.dag.put(signedCommit, FAKE_CID_2)

    const sPayload = dagCBOR.util.deserialize(signedCommit.linkedBlock)
    await context.ipfs.dag.put(sPayload, signedCommit.jws.link)

    // apply signed
    state = await tileDoctypeHandler.applyCommit(signedCommit.jws, FAKE_CID_2, context, state)

    await context.ipfs.dag.put(COMMITS.proof, FAKE_CID_4)
    // apply anchor
    state = await tileDoctypeHandler.applyCommit(COMMITS.r2.commit as AnchorCommit, FAKE_CID_3, context, state)
    expect(state).toMatchSnapshot()
  })
})
