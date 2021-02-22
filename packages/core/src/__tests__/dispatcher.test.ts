import Dispatcher  from '../dispatcher'
import CID from 'cids'
import Document from "../document"
import { TileDoctype } from "@ceramicnetwork/doctype-tile"
import DocID from "@ceramicnetwork/docid";
import { LoggerProvider } from "@ceramicnetwork/common";
import * as uint8arrays from 'uint8arrays';
import { asIpfsMessage } from '../pubsub/__tests__/as-ipfs-message';
import { PubsubMessage, serialize, MsgType } from '../pubsub/pubsub-message';
import { Repository } from '../repository';

const TOPIC = '/ceramic'
const FAKE_CID = new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID2 = new CID('bafybeig6xv5nwphfmvcnektpnojts44jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_DOC_ID = DocID.fromString("kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s")

const ipfs = {
  pubsub: {
    ls: jest.fn(async () => Promise.resolve(TOPIC)),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(async () => Promise.resolve()),
    publish: jest.fn()
  },
  dag: {
    put: jest.fn(() => FAKE_CID),
    get: jest.fn(() => ({ value: 'data' }))
  },
  block: {
    stat: jest.fn(() => ({ size: 10 }))
  },
  id: (): any => ({ id: 'ipfsid' })
}

class TileDoctypeMock extends TileDoctype {
  get doctype() {
    return 'tile'
  }

  get tip() {
    return FAKE_CID
  }
}

describe('Dispatcher', () => {

  let dispatcher: Dispatcher
  const loggerProvider = new LoggerProvider()

  beforeEach(async () => {
    ipfs.dag.put.mockClear()
    ipfs.dag.get.mockClear()
    ipfs.pubsub.subscribe.mockClear()
    ipfs.pubsub.unsubscribe.mockClear()
    ipfs.pubsub.publish.mockClear()

    const repository = new Repository()
    dispatcher = new Dispatcher(ipfs, TOPIC, repository, loggerProvider.getDiagnosticsLogger(), loggerProvider.makeServiceLogger("pubsub"))
    await dispatcher.init()
  })

  afterEach(async () => {
    await dispatcher.close()
  })

  it('is constructed correctly', async () => {
    expect((dispatcher as any).repository).toBeInstanceOf(Repository)
    expect(ipfs.pubsub.subscribe).toHaveBeenCalledWith(TOPIC, expect.anything())
  })

  it('closes correctly', async () => {
    await dispatcher.close()
    expect(ipfs.pubsub.unsubscribe).toHaveBeenCalledTimes(2)
    expect(ipfs.pubsub.unsubscribe).toHaveBeenCalledWith(TOPIC)
  })

  it('makes registration correctly', async () => {
    const doc = new Document(
      FAKE_DOC_ID,
      dispatcher,
      null,
      false,
      {loggerProvider},
      null,
      null
    )
    doc['_doctype'] = new TileDoctypeMock(null, {})
    await dispatcher.register(doc)

    const publishArgs = ipfs.pubsub.publish.mock.calls[0]
    expect(publishArgs[0]).toEqual(TOPIC)
    const queryMessageSent = JSON.parse(publishArgs[1])
    delete queryMessageSent.id
    expect(queryMessageSent).toEqual({typ: MsgType.QUERY, doc: FAKE_DOC_ID.toString()})
  })

  it('store record correctly', async () => {
    expect(await dispatcher.storeCommit('data')).toEqual(FAKE_CID)
  })

  it('retrieves record correctly', async () => {
    expect(await dispatcher.retrieveCommit(FAKE_CID)).toEqual('data')
  })

  it('publishes tip correctly', async () => {
    const tip = new CID('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D')
    dispatcher.publishTip(FAKE_DOC_ID, tip)
    expect(ipfs.pubsub.publish).toHaveBeenCalledWith(TOPIC, serialize({ typ: MsgType.UPDATE, doc: FAKE_DOC_ID, tip: tip }))
  })

  it('errors on invalid message type', async () => {
    const id = '/ceramic/bagjqcgzaday6dzalvmy5ady2m5a5legq5zrbsnlxfc2bfxej532ds7htpova'
    const asBytes = uint8arrays.fromString(JSON.stringify({ typ: -1, id }))
    const ipfsMessage = {
      from: 'outer-space',
      data: asBytes
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await expect(dispatcher.handleMessage(ipfsMessage)).rejects.toThrow("Unhandled -1: Unknown message type")
  })

  it('handle message correctly', async () => {
    const doc = new Document(
      FAKE_DOC_ID,
      dispatcher,
      null,
      false,
      {loggerProvider},
      null,
      null
    )
    doc['_doctype'] = new TileDoctypeMock(null, {})
    await dispatcher.register(doc)

    // Store the query ID sent when the doc is registered so we can use it as the response ID later
    const publishArgs = ipfs.pubsub.publish.mock.calls[0]
    expect(publishArgs[0]).toEqual(TOPIC)
    const queryMessageSent = JSON.parse(publishArgs[1])
    const queryID = queryMessageSent.id

    // Handle UPDATE message
    const updatePromise = new Promise(resolve => doc.on('update', resolve))
    await dispatcher.handleMessage(asIpfsMessage({ typ: MsgType.UPDATE, doc: FAKE_DOC_ID, tip: FAKE_CID }))
    expect(await updatePromise).toEqual(FAKE_CID)

    // Handle QUERY message
    await dispatcher.handleMessage(asIpfsMessage({ typ: MsgType.QUERY, doc: FAKE_DOC_ID, id: "1" }))
    expect(ipfs.pubsub.publish).lastCalledWith(TOPIC, serialize({ typ: MsgType.RESPONSE, id: "1", tips: new Map().set(FAKE_DOC_ID.toString(), FAKE_CID) }))

    // Handle RESPONSE message
    const updatePromise2 = new Promise(resolve => doc.on('update', resolve))
    const tips = new Map().set(FAKE_DOC_ID, FAKE_CID2)
    await dispatcher.handleMessage(asIpfsMessage({ typ: MsgType.RESPONSE, id: queryID, tips: tips }))
    expect(await updatePromise2).toEqual(FAKE_CID2)
  })
})
