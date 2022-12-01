import { CID } from 'multiformats/cid'
import { CommitType, StreamState } from '@ceramicnetwork/common'
import { CeramicClient } from '../ceramic-http-client.js'
import { TileDocument } from '@ceramicnetwork/stream-tile'

const API_URL = 'https://example.com'
const FAKE_CID_1 = CID.parse('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
const initial = {
  type: 0,
  log: [
    {
      type: CommitType.GENESIS,
      cid: FAKE_CID_1,
    },
  ],
} as unknown as StreamState

describe('buildStreamFromState', () => {
  test('build instance of Streamtype', async () => {
    const client = new CeramicClient(API_URL)
    const a = client.buildStreamFromState(initial)
    expect(a).toBeInstanceOf(TileDocument)
    expect(a.id.cid).toEqual(FAKE_CID_1)
  })
})
