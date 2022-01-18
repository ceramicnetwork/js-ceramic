import { createCeramic } from '../../create-ceramic.js'
import { createIPFS } from '../../create-ipfs.js'
import { CeramicApi, IpfsApi } from '@ceramicnetwork/common'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore CJS-ESM Interop
import tendermint from '@tendermint/sig'
import * as linking from '@ceramicnetwork/blockchain-utils-linking'
import { clearDid, happyPath, wrongProof } from './caip-flows.js'

const mnemonic = 'test salon husband push melody usage fine ensure blade deal miss twin'
const localProvider = tendermint.createWalletFromMnemonic(mnemonic)
const chainRef = 'cosmoshub-3'

class CosmosMockSigner {
  constructor(readonly provider: tendermint.Wallet) {}

  public async sign(msg: tendermint.Tx, metadata: tendermint.SignMeta): Promise<tendermint.StdTx> {
    return tendermint.signTx(msg, metadata, this.provider)
  }
}

let ceramic: CeramicApi
let ipfs: IpfsApi

beforeAll(async () => {
  ipfs = await createIPFS()
  ceramic = await createCeramic(ipfs)
}, 120000)

afterAll(async () => {
  await ceramic.close()
  await ipfs?.stop()
}, 120000)

test('happy path', async () => {
  const provider = new CosmosMockSigner(localProvider)
  const authProvider = new linking.cosmos.CosmosAuthProvider(
    provider,
    localProvider.address,
    chainRef
  )
  await happyPath(ceramic, authProvider)
}, 120000)

test('wrong proof', async () => {
  const provider = new CosmosMockSigner(localProvider)
  const authProvider = new linking.cosmos.CosmosAuthProvider(
    provider,
    localProvider.address,
    chainRef
  )
  await wrongProof(ceramic, authProvider)
}, 120000)

test('clear did', async () => {
  const provider = new CosmosMockSigner(localProvider)
  const authProvider = new linking.cosmos.CosmosAuthProvider(
    provider,
    localProvider.address,
    chainRef
  )
  await clearDid(ceramic, authProvider)
}, 120000)
