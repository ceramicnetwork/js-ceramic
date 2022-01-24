import { jest } from '@jest/globals'
import { Utils } from '../../utils.js'
import { CeramicApi, StreamState, TestUtils, CommitType } from '@ceramicnetwork/common'
import { CID } from 'multiformats/cid'
import { TileDocument } from '@ceramicnetwork/stream-tile'

const FAKE_CID = CID.parse('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')

class BasicStreamWithContent extends TileDocument {
  makeReadOnly() {
    throw new Error('Not implemented')
  }
}

describe('Stream', () => {
  let ceramic: CeramicApi
  const schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'StringMap',
    type: 'object',
    additionalProperties: {
      type: 'string',
    },
  }

  beforeAll(() => {
    const docSchemaState = {
      content: schema,
      type: 0,
      metadata: {
        controllers: [],
        schema: 'ceramic://1234567',
      },
      log: [
        {
          type: CommitType.GENESIS,
          cid: FAKE_CID,
        },
      ],
    } as unknown as StreamState

    const schemaDoc = new BasicStreamWithContent(TestUtils.runningState(docSchemaState), null)

    ceramic = {
      loadStream: jest.fn().mockReturnValue(Promise.resolve(schemaDoc)),
    } as unknown as CeramicApi
  })

  it('should pass schema validation', async () => {
    const state = {
      type: 0,
      metadata: {
        controllers: [],
        schema: 'ceramic://1234567',
      },
      content: {
        x: 'y',
      },
      log: [
        {
          type: CommitType.GENESIS,
          cid: FAKE_CID,
        },
      ],
    } as unknown as StreamState

    const doc = new BasicStreamWithContent(TestUtils.runningState(state), { api: ceramic })
    await Utils.validateSchema(doc)
  })

  it('should fail schema validation', async () => {
    const state = {
      type: 0,
      metadata: {
        controllers: [],
        schema: 'ceramic://1234567',
      },
      content: {
        x: 1,
      },
      log: [
        {
          type: CommitType.GENESIS,
          cid: FAKE_CID,
        },
      ],
    } as unknown as StreamState

    const doc = new BasicStreamWithContent(TestUtils.runningState(state), { api: ceramic })
    await expect(Utils.validateSchema(doc)).rejects.toThrow(
      'Validation Error: data/x must be string'
    )
  })
})
