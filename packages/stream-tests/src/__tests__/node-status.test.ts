import { jest } from '@jest/globals'
import getPort from 'get-port'
import { CeramicApi, IpfsApi, NodeStatusResponse } from '@ceramicnetwork/common'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { createCeramic } from '../create-ceramic.js'
import { Ceramic } from '@ceramicnetwork/core'
import { CeramicDaemon, DaemonConfig } from '@ceramicnetwork/cli'
import { CeramicClient } from '@ceramicnetwork/http-client'
import { DID } from 'dids'
import { makeDID } from '@ceramicnetwork/cli/lib/__tests__/make-did.js'

describe('Node Status Endpoint tests', () => {
  jest.setTimeout(1000 * 90)

  let ipfs: IpfsApi
  let port: number
  let core: Ceramic
  let daemon: CeramicDaemon
  let ceramic: CeramicClient
  let adminDid: DID
  let nonAdminDid: DID

  const getStatus = async (ceramic: CeramicApi): Promise<NodeStatusResponse> => {
    const currentDid = ceramic.did
    ceramic.did = adminDid
    const status = await ceramic.admin.nodeStatus()
    ceramic.did = currentDid
    return status
  }

  beforeAll(async () => {
    ipfs = await createIPFS()
  })

  afterAll(async () => {
    await ipfs.stop()
  })

  beforeEach(async () => {
    core = await createCeramic(ipfs)

    adminDid = makeDID(core, 'ADMIN SEED')
    await adminDid.authenticate()
    nonAdminDid = makeDID(core, 'NON ADMIN SEED')
    await nonAdminDid.authenticate()

    port = await getPort()
    const apiUrl = 'http://localhost:' + port
    daemon = new CeramicDaemon(
      core,
      DaemonConfig.fromObject({
        'http-api': { port, 'admin-dids': [adminDid.id.toString()] },
        node: {},
      })
    )
    await daemon.listen()
    ceramic = new CeramicClient(apiUrl)
    ceramic.did = nonAdminDid
  }, 30 * 1000)

  afterEach(async () => {
    await ceramic.close()
    await daemon.close()
    await core.close()
  })

  test('basic node status test', async () => {
    const status = await getStatus(ceramic)
    expect(typeof status.runId).toEqual('string')
    expect(status.uptimeMs).toBeGreaterThan(0)
    expect(status.network).toEqual('inmemory')
    expect(status.anchor.anchorServiceUrl).toEqual('<inmemory>')
    expect(status.anchor.ethereumRpcEndpoint).toBeNull()
    expect(status.anchor.chainId).toEqual('inmemory:12345')
    expect(status.anchor.pendingAnchors).toEqual(0)
    expect(typeof status.ipfs.peerId).toEqual('string')
    for (const addr of status.ipfs.addresses) {
      expect(typeof addr).toEqual('string')
    }
  })
})
