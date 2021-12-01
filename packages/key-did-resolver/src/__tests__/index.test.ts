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

    let doc = await resolve('did:key:zQ3shbgnTGcgBpXPdBjDur3ATMDWhS7aPs6FRFkWR19Lb9Zwz', parsedDid, {}, { accept: 'application/did+ld+json' })
    expect(doc).toMatchSnapshot()

    doc = await resolve('did:key:zQ3shbgnTGcgBpXPdBjDur3ATMDWhS7aPs6FRFkWR19Lb9Zwz', parsedDid, {}, { accept: 'application/did+json' })
    expect(doc).toMatchSnapshot()

    parsedDid = {
      id: "z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8",
      did: 'did:key:z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8',
      method: "key",
      didUrl: 'did:key:z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8/some/path',
      path: '/some/path'
    }

    doc = await resolve('did:key:z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8', parsedDid, {}, { accept: 'application/did+ld+json' })
    expect(doc).toMatchSnapshot()

    doc = await resolve('did:key:z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8', parsedDid, {}, { accept: 'application/did+json' })
    expect(doc).toMatchSnapshot()

    parsedDid = {
      id: "zruuPojWkzGPb8sVc42f2YxcTXKUTpAUbdrzVovaTBmGGNyK6cGFaA4Kp7SSLKecrxYz8Sc9d77Rss7rayYt1oFCaNJ",
      did: 'did:key:zruuPojWkzGPb8sVc42f2YxcTXKUTpAUbdrzVovaTBmGGNyK6cGFaA4Kp7SSLKecrxYz8Sc9d77Rss7rayYt1oFCaNJ',
      method: "key",
      didUrl: 'did:key:zruuPojWkzGPb8sVc42f2YxcTXKUTpAUbdrzVovaTBmGGNyK6cGFaA4Kp7SSLKecrxYz8Sc9d77Rss7rayYt1oFCaNJ/some/path',
      path: '/some/path'
    }
  
    doc = await resolve('did:key:zruuPojWkzGPb8sVc42f2YxcTXKUTpAUbdrzVovaTBmGGNyK6cGFaA4Kp7SSLKecrxYz8Sc9d77Rss7rayYt1oFCaNJ', parsedDid, {}, { accept: 'application/did+ld+json' })
    expect(doc).toMatchSnapshot()
  
    doc = await resolve('did:key:zruuPojWkzGPb8sVc42f2YxcTXKUTpAUbdrzVovaTBmGGNyK6cGFaA4Kp7SSLKecrxYz8Sc9d77Rss7rayYt1oFCaNJ', parsedDid, {}, { accept: 'application/did+json' })
    expect(doc).toMatchSnapshot()

    parsedDid = {
      id: "zDnaeUKTWUXc1HDpGfKbEK31nKLN19yX5aunFd7VK1CUMeyJu",
      did: 'did:key:zDnaeUKTWUXc1HDpGfKbEK31nKLN19yX5aunFd7VK1CUMeyJu',
      method: "key",
      didUrl: 'did:key:zDnaeUKTWUXc1HDpGfKbEK31nKLN19yX5aunFd7VK1CUMeyJu/some/path',
      path: '/some/path'
    }
  
    doc = await resolve('did:key:zDnaeUKTWUXc1HDpGfKbEK31nKLN19yX5aunFd7VK1CUMeyJu', parsedDid, {}, { accept: 'application/did+ld+json' })
    expect(doc).toMatchSnapshot()
  
    doc = await resolve('did:key:zDnaeUKTWUXc1HDpGfKbEK31nKLN19yX5aunFd7VK1CUMeyJu', parsedDid, {}, { accept: 'application/did+json' })
    expect(doc).toMatchSnapshot()

    parsedDid = {
      id: "z4oJ8emo5e6mGPCUS5wncFZXAyuVzGRyJZvoduwq7FrdZYPd1LZQbDKsp1YAMX8x14zBwy3yHMSpfecJCMDeRFUgFqYsY",
      did: 'did:key:z4oJ8emo5e6mGPCUS5wncFZXAyuVzGRyJZvoduwq7FrdZYPd1LZQbDKsp1YAMX8x14zBwy3yHMSpfecJCMDeRFUgFqYsY',
      method: "key",
      didUrl: 'did:key:z4oJ8emo5e6mGPCUS5wncFZXAyuVzGRyJZvoduwq7FrdZYPd1LZQbDKsp1YAMX8x14zBwy3yHMSpfecJCMDeRFUgFqYsY/some/path',
      path: '/some/path'
    }
  
    doc = await resolve('did:key:z4oJ8emo5e6mGPCUS5wncFZXAyuVzGRyJZvoduwq7FrdZYPd1LZQbDKsp1YAMX8x14zBwy3yHMSpfecJCMDeRFUgFqYsY', parsedDid, {}, { accept: 'application/did+ld+json' })
    expect(doc).toMatchSnapshot()
  
    doc = await resolve('did:key:z4oJ8emo5e6mGPCUS5wncFZXAyuVzGRyJZvoduwq7FrdZYPd1LZQbDKsp1YAMX8x14zBwy3yHMSpfecJCMDeRFUgFqYsY', parsedDid, {}, { accept: 'application/did+json' })
    expect(doc).toMatchSnapshot()

  })


})

/*
test('expect index.js to throw an error for an unsupported media type', () => {
     expect(() => {
        let parsedDided25519 = {
           id: "z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8",
           did: 'did:key:z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8',
           method: "key",
           didUrl: 'did:key:z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8/some/path',
           path: '/some/path'
        }

        let doced25519 = await resolve('did:key:z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8', parsedDided25519, {}, { accept: 'application/rdf+xml' })
     }).toThrowError('representationNotSupported');
});

test('expect index.js to throw an error for an unsupported decentralized indentifier', () => {
      expect(() => {
         let parsedDided25519 = {
            id: "z6LSeu9HkTHSfLLeUs2nnzUSNedgDUevfNQgQjQC23ZCit6F",
            did: 'did:key:z6LSeu9HkTHSfLLeUs2nnzUSNedgDUevfNQgQjQC23ZCit6F',
            method: "key",
            didUrl: 'did:key:z6LSeu9HkTHSfLLeUs2nnzUSNedgDUevfNQgQjQC23ZCit6F/some/path',
            path: '/some/path'
         }

        let doced25519 = await resolve('did:key:z6LSeu9HkTHSfLLeUs2nnzUSNedgDUevfNQgQjQC23ZCit6F', parsedDided25519, {}, { accept: 'application/did+ld+json' })

      }).toThrowError('invalidDid');
});
*/

