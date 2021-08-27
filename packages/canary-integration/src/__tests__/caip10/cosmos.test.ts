import { createCeramic } from '../../create-ceramic'
import { createIPFS } from '../../create-ipfs'
import { CeramicApi, IpfsApi } from '@ceramicnetwork/common'
import { signTx, Tx, SignMeta, createWalletFromMnemonic, Wallet, StdTx } from '@tendermint/sig'
import * as linking from '@ceramicnetwork/blockchain-utils-linking'
import { Caip10Link } from '@ceramicnetwork/stream-caip10-link'

const mnemonic = 'test salon husband push melody usage fine ensure blade deal miss twin'
const localProvider = createWalletFromMnemonic(mnemonic)
const chainRef = 'cosmoshub-3'

class CosmosMockSigner {
  constructor(readonly provider: Wallet) {}

  public async sign(msg: Tx, metadata: SignMeta): Promise<StdTx> {
    return signTx(msg, metadata, this.provider)
  }
}

let ceramic: CeramicApi
let ipfs: IpfsApi

beforeEach(async () => {
  ceramic = await createCeramic(ipfs)
}, 20000)

afterEach(async () => {
  await ceramic.close()
}, 20000)

beforeAll(async () => {
  ipfs = await createIPFS()
}, 20000)

afterAll(async () => {
  await ipfs?.stop()
}, 20000)

test('happy path', async () => {
  const provider = new CosmosMockSigner(localProvider)
  const authProvider = new linking.cosmos.CosmosAuthProvider(
    provider,
    localProvider.address,
    chainRef
  )
  const accountId = await authProvider.accountId()
  const caip = await Caip10Link.fromAccount(ceramic, accountId)
  await caip.setDid(ceramic.did, authProvider)
  expect(caip.state.log.length).toEqual(2)
  expect(caip.did).toEqual(ceramic.did.id)
}, 20000)

test('wrong proof', async () => {
  const provider = new CosmosMockSigner(localProvider)
  const authProvider = new linking.cosmos.CosmosAuthProvider(
    provider,
    localProvider.address,
    chainRef
  )
  const accountId = await authProvider.accountId()
  accountId.address = 'cosmos1foo'
  const caip = await Caip10Link.fromAccount(ceramic, accountId)
  await expect(caip.setDid(ceramic.did, authProvider)).rejects.toThrow(
    /Address doesn't match stream controller/
  )
}, 20000)
