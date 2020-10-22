import { mock } from 'jest-mock-extended'

import Utils from '../../utils'
import { CeramicApi, Doctype, DocState } from "@ceramicnetwork/ceramic-common"


class BasicDoctype extends Doctype {
    change(): Promise<void> {
        throw new Error('Not implemented')
    }
}

describe('Doctype', () => {
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
        const docSchemaState = mock<DocState>()
        docSchemaState.content = schema
        docSchemaState.metadata = {
            owners: [],
            schema: 'ceramic://1234567'
        }

        const schemaDoc = new BasicDoctype(docSchemaState, null)

        ceramic = mock<CeramicApi>()
        ceramic.loadDocument.mockReturnValue(new Promise<Doctype>((resolve) => {
            resolve(schemaDoc);
        }));
    })

    it('should pass schema validation', async () => {
        const state = mock<DocState>()
        state.metadata = {
            owners: [],
            schema: 'ceramic://1234567'
        }
        state.content = {
            'x': 'y'
        }

        const doc = new BasicDoctype(state, { api: ceramic })
        await Utils.validateDoctype(doc)
    })

    it('should fail schema validation', async () => {
        const state = mock<DocState>()
        state.metadata = {
            owners: [],
            schema: 'ceramic://1234567'
        }
        state.content = {
            'x': 1
        }

        const doc = new BasicDoctype(state, { api: ceramic })
        try {
            await Utils.validateDoctype(doc)
            throw new Error('Should not be able to validate invalid data')
        } catch (e) {
            expect(e.message).toEqual('Validation Error: data[\'x\'] should be string')
        }
    })
})
