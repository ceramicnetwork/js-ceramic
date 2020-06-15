import User from '../user'
import IdentityWallet from 'identity-wallet'
import VerifierAlrgorithm from 'did-jwt/src/VerifierAlgorithm.ts'
import { DIDProvider } from "../ceramic-api"

describe('User', () => {

  const seed = '0x5872d6e0ae7347b72c9216db218ebbb9d9d0ae7ab818ead3557e8e78bf944184'
  let idWallet, provider: DIDProvider

  beforeEach(() => {
    idWallet = new IdentityWallet(() => true, { seed })
    provider = idWallet.get3idProvider()
  })

  it('authenticates correctly', async () => {
    const user = new User(provider)
    await user.auth()
    expect(user.publicKeys).toMatchSnapshot()
  })

  it('signs data correctly', async () => {
    const user = new User(provider)
    await user.auth()
    user.DID = 'did:3:bafy87y34087y3'
    const jwt = await user.sign({ asdf: 234 })
    const [header, payload, signature] = jwt.split('.')
    const authenticator = { publicKeyHex: user.publicKeys.signingKey }
    const verified = await VerifierAlrgorithm('ES256K')(header + '.' + payload, signature, [authenticator])
    expect(verified).toEqual(authenticator)
  })

  it('signs data correctly with managementKey', async () => {
    const user = new User(provider)
    await user.auth()
    user.DID = 'did:3:bafy87y34087y3'
    const jwt = await user.sign({ asdf: 234 }, { useMgmt: true })
    const [header, payload, signature] = jwt.split('.')
    const authenticator = { publicKeyHex: user.publicKeys.managementKey }
    const verified = await VerifierAlrgorithm('ES256K')(header + '.' + payload, signature, [authenticator])
    expect(verified).toEqual(authenticator)
  })
})
