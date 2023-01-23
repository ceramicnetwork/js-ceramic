import { jest } from '@jest/globals'
import { indices } from '../1-create-model-table'

describe('indices', () => {
    test('correctly build default indices for a table name', () => {
        const t = indices('dropped_for_thisstuffy')
        expect(t.indexName).toEqual('thisstuffy')
        expect(t.indices.length).toEqual(6)
    })
})
