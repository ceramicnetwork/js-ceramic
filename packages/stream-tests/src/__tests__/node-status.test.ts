import { jest } from '@jest/globals'
import getPort from 'get-port'
import {
  AnchorStatus,
  CeramicApi,
  IpfsApi,
  NodeStatusResponse,
  TestUtils,
} from '@ceramicnetwork/common'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { ModelInstanceDocument } from '@ceramicnetwork/stream-model-instance'
import { createCeramic } from '../create-ceramic.js'
import { Ceramic } from '@ceramicnetwork/core'
import { CeramicDaemon, DaemonConfig } from '@ceramicnetwork/cli'
import { CeramicClient } from '@ceramicnetwork/http-client'
import { Model, ModelDefinition } from '@ceramicnetwork/stream-model'
import tmp from 'tmp-promise'
import * as fs from 'fs/promises'
import { DID } from 'dids'
import { makeDID } from '@ceramicnetwork/cli/lib/__tests__/make-did.js'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { InMemoryAnchorService } from '@ceramicnetwork/core/lib/anchor/memory/in-memory-anchor-service.js'

const CONTENT0 = { myData: 0 }
const CONTENT1 = { myData: 1 }

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

  test('Pending anchor counter test', async () => {
    let status = await getStatus(ceramic)
    expect(status.anchor.pendingAnchors).toEqual(0)

    const doc = await TileDocument.create(ceramic, CONTENT0)

    status = await getStatus(ceramic)
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.PENDING)
    expect(status.anchor.pendingAnchors).toEqual(1)

    await TestUtils.anchorUpdate(core, doc)

    // Counter gets reset when stream is anchored
    status = await getStatus(ceramic)
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(status.anchor.pendingAnchors).toEqual(0)

    await doc.update(CONTENT1)

    status = await getStatus(ceramic)
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.PENDING)
    expect(status.anchor.pendingAnchors).toEqual(1)

    await (core.context.anchorService as InMemoryAnchorService).failPendingAnchors()
    await TestUtils.waitForState(
      doc,
      1000 * 60,
      (state) => state.anchorStatus == AnchorStatus.FAILED
    )

    // Counter gets reset if anchor fails
    status = await getStatus(ceramic)
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.FAILED)
    expect(status.anchor.pendingAnchors).toEqual(0)
  })
})
