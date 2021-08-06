import index from '../index'
import { Resolver } from 'did-resolver'

const ethDid = 'did:pkh:eip155:1:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb'
const btcDid = 'bdid:pkh:ip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6'

describe('PKH DID Resolver', () => {
  it('successfully resolves DIDs', async () => {
    const resolverRegistry = index.getResolver()
    const resolver = new Resolver(resolverRegistry)


    expect(await resolver.resolve(ethDid)).toMatchSnapshot()
    expect(await resolver.resolve(ethDid)).toMatchSnapshot()

    expect(await resolver.resolve(ethDid, { accept: 'application/did+ld+json' })).toMatchSnapshot()
    expect(await resolver.resolve(ethDid, { accept: 'application/did+ld+json' })).toMatchSnapshot()
  })
})
