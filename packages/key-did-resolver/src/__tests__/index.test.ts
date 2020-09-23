import index from '../index'

describe('Index mapper', () => {

    it('successfully resolves the document from did', async () => {
        const resolverRegistry = index.getResolver()
        expect(resolverRegistry).not.toBeUndefined()

        const resolve = resolverRegistry.key
        expect(resolve).not.toBeUndefined()

        const doc = await resolve('did:key:zQ3shbgnTGcgBpXPdBjDur3ATMDWhS7aPs6FRFkWR19Lb9Zwz', {
            id: "zQ3shbgnTGcgBpXPdBjDur3ATMDWhS7aPs6FRFkWR19Lb9Zwz",
            did: 'did:key:zQ3shbgnTGcgBpXPdBjDur3ATMDWhS7aPs6FRFkWR19Lb9Zwz',
            method: "key",
            didUrl: 'did:key:zQ3shbgnTGcgBpXPdBjDur3ATMDWhS7aPs6FRFkWR19Lb9Zwz/some/path',
            path: '/some/path'
        })
        expect(doc).toMatchSnapshot()
    })

})

