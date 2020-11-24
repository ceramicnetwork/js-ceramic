import index from '../index'

describe('Index mapper', () => {

    it('successfully resolves the document from did', async () => {
        const resolverRegistry = index.getResolver()
        expect(resolverRegistry).not.toBeUndefined()

        const resolve = resolverRegistry.key
        expect(resolve).not.toBeUndefined()

        let parsedDid = {
            id: "zQ3shbgnTGcgBpXPdBjDur3ATMDWhS7aPs6FRFkWR19Lb9Zwz",
            did: 'did:key:zQ3shbgnTGcgBpXPdBjDur3ATMDWhS7aPs6FRFkWR19Lb9Zwz',
            method: "key",
            didUrl: 'did:key:zQ3shbgnTGcgBpXPdBjDur3ATMDWhS7aPs6FRFkWR19Lb9Zwz/some/path',
            path: '/some/path'
        }

        let doc = await resolve('did:key:zQ3shbgnTGcgBpXPdBjDur3ATMDWhS7aPs6FRFkWR19Lb9Zwz', parsedDid)
        expect(doc).toMatchSnapshot()

        parsedDid = {
            id: "z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8",
            did: 'did:key:z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8',
            method: "key",
            didUrl: 'did:key:z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8/some/path',
            path: '/some/path'
        }

        doc = await resolve('did:key:z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8', parsedDid)
        expect(doc).toMatchSnapshot()
    })

})

