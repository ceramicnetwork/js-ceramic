import { mock } from 'jest-mock-extended'

import Utils from '../../utils'
import { CeramicApi, Stream, DocState, TestUtils, CommitType } from '@ceramicnetwork/common';
import CID from 'cids'

const FAKE_CID = new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu');

class BasicStreamWithContent extends Stream {
    makeReadOnly() {
        throw new Error('Not implemented')
    }

    get content(): Record<string, any> {
        return this._getContent()
    }
}

describe('Stream', () => {
    let ceramic: any
    const schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "StringMap",
        "type": "object",
        "additionalProperties": {
            "type": "string"
        }
    }

    beforeAll(() => {
        const docSchemaState = {
          content: schema,
          type: 0,
          metadata: {
            controllers: [],
            schema: 'ceramic://1234567'
          },
          log: [
            {
              type: CommitType.GENESIS,
              cid: FAKE_CID
            }
          ]
        } as unknown as DocState

        const schemaDoc = new BasicStreamWithContent(TestUtils.runningState(docSchemaState), null)

        ceramic = mock<CeramicApi>()
        ceramic.loadDocument.mockReturnValue(new Promise<Stream>((resolve) => {
            resolve(schemaDoc);
        }));
    })

    it('should pass schema validation', async () => {
        const state = {
          type: 0,
          metadata: {
            controllers: [],
            schema: 'ceramic://1234567'
          },
          content: {
            'x': 'y'
          },
          log: [
            {
              type: CommitType.GENESIS,
              cid: FAKE_CID
            }
          ]
        } as unknown as DocState

        const doc = new BasicStreamWithContent(TestUtils.runningState(state), { api: ceramic })
        await Utils.validateSchema(doc)
    })

    it('should fail schema validation', async () => {
        const state = {
          type: 0,
          metadata: {
            controllers: [],
            schema: 'ceramic://1234567'
          },
          content: {
            'x': 1
          },
          log: [
            {
              type: CommitType.GENESIS,
              cid: FAKE_CID
            }
          ]
        } as unknown as DocState;

        const doc = new BasicStreamWithContent(TestUtils.runningState(state), { api: ceramic })
        try {
            await Utils.validateSchema(doc)
            throw new Error('Should not be able to validate invalid data')
        } catch (e) {
            expect(e.message).toEqual('Validation Error: data[\'x\'] should be string')
        }
    })
})
