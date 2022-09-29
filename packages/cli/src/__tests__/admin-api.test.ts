import KeyResolver from 'key-did-resolver'
import { fetchJson, IpfsApi } from '@ceramicnetwork/common'
import { DID } from 'dids'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import * as sha256 from '@stablelib/sha256'
import * as uint8arrays from 'uint8arrays'
import { CeramicDaemon } from '../ceramic-daemon.js'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { makeCeramicCore } from './make-ceramic-core.js'
import { makeCeramicDaemon } from './make-ceramic-daemon.js'
import { CeramicClient } from '@ceramicnetwork/http-client'
import { makeDID } from './make-did.js'
import { Ceramic } from '@ceramicnetwork/core'
import tmp from 'tmp-promise'

const seed = 'ADMINSEED'


describe('admin api', () => {
  let daemon: CeramicDaemon
  let adminDid: DID
  let nonAdminDid: DID
  let originalEnvVarVal: string | undefined
  let ipfs: IpfsApi
  let tmpFolder: tmp.DirectoryResult
  let core: Ceramic
  let client: CeramicClient

  beforeAll(async () => {
    // FIXME: How should we be setting up this env var properly?
    originalEnvVarVal = process.env.CERAMIC_ENABLE_EXPERIMENTAL_COMPOSE_DB
    process.env.CERAMIC_ENABLE_EXPERIMENTAL_COMPOSE_DB = 'true'
    ipfs = await createIPFS()
  })

  afterAll(async () => {
    await ipfs.stop()
    process.env.CERAMIC_ENABLE_EXPERIMENTAL_COMPOSE_DB = originalEnvVarVal
  })

  beforeEach(async () => {
    tmpFolder = await tmp.dir({ unsafeCleanup: true })
    core = await makeCeramicCore(ipfs, tmpFolder.path)
    daemon = await makeCeramicDaemon(core)
    const apiUrl = `http://localhost:${daemon.port}`
    client = new CeramicClient(apiUrl, { syncInterval: 500 })

    await core.setDID(makeDID(core, seed))
    await client.setDID(makeDID(client, seed))
  })

  afterEach(async () => {
    await client.close()
    await daemon.close()
    await core.close()
    await tmpFolder.cleanup()
  })

  async function buildAuthorizationHeader(did: DID, outdated = false, models?: Array<string>): Promise<string> {
    const body = models ? { models: models } : undefined
    const fiveMinsOneSec = 1000 * 60 * 5 + 1
    const jws = await did.createJWS({
      timestamp: (new Date()).getTime() - (outdated ? fiveMinsOneSec : 0),
      requestPath: '/api/v0/admin/models',
      requestBody: body
    })
    const jwsString = `${jws.signatures[0].protected}.${jws.payload}.${jws.signatures[0].signature}`
    return `Authorization: Basic ${jwsString}`
  }

  beforeAll(async () => {
    const did = new DID({
      provider: new Ed25519Provider(sha256.hash(uint8arrays.fromString(seed))),
      resolver: KeyResolver.getResolver() })
    await did.authenticate()
    adminDid = did

    const anotherDid = new DID({
      provider: new Ed25519Provider(sha256.hash(uint8arrays.fromString('non-admin'))),
      resolver: KeyResolver.getResolver() })
    await anotherDid.authenticate()
    nonAdminDid = anotherDid
  })

  it('admin models API CRUD test', async () => {
    const exampleModelStreamId = "kjzl6hvfrbw6cag2xpszaxtixzk799xcdy6ashjhxhbvl2x0kn1lvfree6u9t2q"
    const adminURLString = `http://localhost:${daemon.port}/api/v0/admin/models`

    const getResult = await fetchJson(adminURLString,
      {
        headers: {
          authorization: await buildAuthorizationHeader(adminDid)
        }
      })
    expect(getResult.models).toEqual([])

    const postResult = await fetchJson(adminURLString, {
      headers: {
        authorization: await buildAuthorizationHeader(adminDid, false, [exampleModelStreamId])
      },
      method:'POST',
      body: {  models: [exampleModelStreamId] }
    })
    expect(postResult.result).toEqual('success')

    const newGetResult = await fetchJson(adminURLString,
      {
        headers: {
          authorization: await buildAuthorizationHeader(adminDid)
        }
      })
    expect(newGetResult.models).toEqual([exampleModelStreamId])

    const deleteResult = await fetchJson(adminURLString, {
      headers: {
        authorization: await buildAuthorizationHeader(adminDid, false, [exampleModelStreamId])
      },
      method:'DELETE',
      body: {  models: [exampleModelStreamId] }
    })
    expect(deleteResult.result).toEqual('success')
    const getResultAfterDelete = await fetchJson(adminURLString,
      {
        headers: {
          authorization: await buildAuthorizationHeader(adminDid)
        }
      })
    expect(getResultAfterDelete.models).toEqual([])
  })

  describe('admin models API validation test', () => {
    const exampleModelStreamId = "kjzl6hvfrbw6cag2xpszaxtixzk799xcdy6ashjhxhbvl2x0kn1lvfree6u9t2q"

    it('Unauthorised DID for GET', async () => {
      await expect(fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`,
        {
          headers: {
            authorization: await buildAuthorizationHeader(nonAdminDid)
          }
        }),
      ).rejects.toThrow(
        /Unauthorized access/
      )
    })

    it('Unauthorised DID for POST', async () => {
      await expect(fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`,
        {
          headers: {
            authorization: await buildAuthorizationHeader(nonAdminDid, false, [exampleModelStreamId])
          },
          method: 'POST',
          body: {  models: [exampleModelStreamId] }
        }),
      ).rejects.toThrow(
        /Unauthorized access/
      )
    })

    it('Unauthorised DID for DELETE', async () => {
      await expect(fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`,
        {
          headers: {
            authorization: await buildAuthorizationHeader(nonAdminDid, false, [exampleModelStreamId])
          },
          method: 'DELETE',
          body: {  models: [exampleModelStreamId] }
        }),
      ).rejects.toThrow(
        /Unauthorized access/
      )
    })

    it('No authorization for GET', async () => {
      await expect(fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`)
      ).rejects.toThrow(
        /Missing authorization header/
      )
    })

    it('No authorization for POST', async () => {
      await expect(fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`,
        {
          method: 'POST',
          body: {  models: [exampleModelStreamId] }
        }),
      ).rejects.toThrow(
        /Missing authorization header/
      )
    })

    it('No authorization for DELETE', async () => {
      await expect(fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`,
        {
          method: 'DELETE',
          body: {  models: [exampleModelStreamId] }
        }),
      ).rejects.toThrow(
        /Missing authorization header/
      )
    })

    it('Outdated authorization header for GET', async () => {
      await expect(fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`,
        {
          headers: {
            authorization: await buildAuthorizationHeader(nonAdminDid, true)
          }
        }),
      ).rejects.toThrow(
        /The authorization header contains a timestamp that is too old/
      )
    })

    it('Outdated authorization header for POST', async () => {
      await expect(fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`,
        {
          headers: {
            authorization: await buildAuthorizationHeader(nonAdminDid, true, [exampleModelStreamId])
          },
          method: 'POST',
          body: {  models: [exampleModelStreamId] }
        }),
      ).rejects.toThrow(
        /The authorization header contains a timestamp that is too old/
      )
    })

    it('Outdated authorization header for DELETE', async () => {
      await expect(fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`,
        {
          headers: {
            authorization: await buildAuthorizationHeader(nonAdminDid, true, [exampleModelStreamId])
          },
          method: 'DELETE',
          body: {  models: [exampleModelStreamId] }
        }),
      ).rejects.toThrow(
        /The authorization header contains a timestamp that is too old/
      )
    })


    it('No models for POST', async () => {
      await expect(fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`,
        {
          headers: {
            authorization: await buildAuthorizationHeader(adminDid)
          },
          method:'POST'
        })
      ).rejects.toThrow(
        /The `models` parameter is required and it has to be an array containing at least one model stream id/
      )
    })

    it('Empty models for POST', async () => {
      await expect(fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`,
        {
          headers: {
            authorization: await buildAuthorizationHeader(adminDid, false,[])
          },
          method:'POST',
          body: { models: [] }
        })
      ).rejects.toThrow(
        /The `models` parameter is required and it has to be an array containing at least one model stream id/
      )
    })

    it('No models for DELETE', async () => {
      await expect(fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`,
        {
          headers: {
            authorization: await buildAuthorizationHeader(adminDid)
          },
          method:'DELETE'
        })
      ).rejects.toThrow(
        /The `models` parameter is required and it has to be an array containing at least one model stream id/
      )
    })

    it('Empty models for DELETE', async () => {
      await expect(fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`,
        {
          headers: {
            authorization: await buildAuthorizationHeader(adminDid, false,[])
          },
          method:'DELETE',
          body: { models: [] }
        })
      ).rejects.toThrow(
        /The `models` parameter is required and it has to be an array containing at least one model stream id/
      )
    })
  })
})
