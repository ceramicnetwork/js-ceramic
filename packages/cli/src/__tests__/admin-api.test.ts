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
import MockDate from 'mockdate'
import { Model } from '@ceramicnetwork/stream-model'

const seed = 'ADMINSEED'
const MY_MODEL_1_CONTENT = { name: 'myModel1', schema: {}, accountRelation: { type: 'list' } }

describe('admin api', () => {
  let daemon: CeramicDaemon
  let adminDid: DID
  let nonAdminDid: DID
  let originalEnvVarVal: string | undefined
  let ipfs: IpfsApi
  let tmpFolder: tmp.DirectoryResult
  let core: Ceramic
  let client: CeramicClient
  let exampleModelStreamId: string

  beforeAll(async () => {
    // FIXME: How should we be setting up this env var properly?
    originalEnvVarVal = process.env.CERAMIC_ENABLE_EXPERIMENTAL_COMPOSE_DB
    process.env.CERAMIC_ENABLE_EXPERIMENTAL_COMPOSE_DB = 'true'
    ipfs = await createIPFS()

    const did = new DID({
      provider: new Ed25519Provider(sha256.hash(uint8arrays.fromString(seed))),
      resolver: KeyResolver.getResolver(),
    })
    await did.authenticate()
    adminDid = did

    const anotherDid = new DID({
      provider: new Ed25519Provider(sha256.hash(uint8arrays.fromString('non-admin'))),
      resolver: KeyResolver.getResolver(),
    })
    await anotherDid.authenticate()
    nonAdminDid = anotherDid

    tmpFolder = await tmp.dir({ unsafeCleanup: true })
    core = await makeCeramicCore(ipfs, tmpFolder.path)
    daemon = await makeCeramicDaemon(core, {
      'http-api': { 'admin-dids': [adminDid.id.toString()] },
    })
    const apiUrl = `http://localhost:${daemon.port}`
    client = new CeramicClient(apiUrl, { syncInterval: 500 })

    core.did = makeDID(core, seed)
    client.did = makeDID(client, seed)

    // @ts-ignore
    const myModel1 = await Model.create(core, MY_MODEL_1_CONTENT)
    exampleModelStreamId = myModel1.id.toString()
  })

  afterAll(async () => {
    await ipfs.stop()
    await client.close()
    await daemon.close()
    await core.close()
    await tmpFolder.cleanup()
    process.env.CERAMIC_ENABLE_EXPERIMENTAL_COMPOSE_DB = originalEnvVarVal
  })

  async function buildJWS(did: DID, code: string, models?: Array<string>): Promise<string> {
    const body = models ? { models: models } : undefined
    const jws = await did.createJWS({
      code: code,
      requestPath: '/api/v0/admin/models',
      requestBody: body,
    })
    return `${jws.signatures[0].protected}.${jws.payload}.${jws.signatures[0].signature}`
  }

  it('admin models API CRUD test', async () => {
    const adminURLString = `http://localhost:${daemon.port}/api/v0/admin/models`

    const fetchCode = async (): Promise<string> => {
      return (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
    }

    const getResult = await fetchJson(adminURLString, {
      headers: {
        authorization: `Authorization: Basic ${await buildJWS(adminDid, await fetchCode())}`,
      },
    })
    expect(getResult.models).toEqual([])

    const postResult = await fetchJson(adminURLString, {
      method: 'POST',
      body: { jws: await buildJWS(adminDid, await fetchCode(), [exampleModelStreamId]) },
    })
    expect(postResult.result).toEqual('success')

    const newGetResult = await fetchJson(adminURLString, {
      headers: {
        authorization: `Authorization: Basic ${await buildJWS(adminDid, await fetchCode())}`,
      },
    })
    expect(newGetResult.models).toEqual([exampleModelStreamId])

    const deleteResult = await fetchJson(adminURLString, {
      method: 'DELETE',
      body: { jws: await buildJWS(adminDid, await fetchCode(), [exampleModelStreamId]) },
    })
    expect(deleteResult.result).toEqual('success')

    const getResultAfterDelete = await fetchJson(adminURLString, {
      headers: {
        authorization: `Authorization: Basic ${await buildJWS(adminDid, await fetchCode())}`,
      },
    })
    expect(getResultAfterDelete.models).toEqual([])
  })

  describe('admin models API validation test', () => {
    it('No admin code for GET', async () => {
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          headers: {
            authorization: `Authorization: Basic ${await buildJWS(adminDid, '')}`,
          },
        })
      ).rejects.toThrow(/Admin code is missing from the the jws block/)
    })

    it('No admin code for POST', async () => {
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'POST',
          body: { jws: await buildJWS(adminDid, '') },
        })
      ).rejects.toThrow(/Admin code is missing from the the jws block/)
    })

    it('No admin code for DELETE', async () => {
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'POST',
          body: { jws: await buildJWS(adminDid, '') },
        })
      ).rejects.toThrow(/Admin code is missing from the the jws block/)
    })

    it('Arbitrary admin code for GET', async () => {
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          headers: {
            authorization: `Authorization: Basic ${await buildJWS(
              adminDid,
              '1B7F4C45-C0E8-4BF3-88E4-8F7C81AB3BEC'
            )}`,
          },
        })
      ).rejects.toThrow(/Unauthorized access: invalid\/already used admin code/)
    })

    it('Arbitrary admin code for POST', async () => {
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'POST',
          body: {
            jws: await buildJWS(adminDid, '1B7F4C45-C0E8-4BF3-88E4-8F7C81AB3BEC', [
              exampleModelStreamId,
            ]),
          },
        })
      ).rejects.toThrow(/Unauthorized access: invalid\/already used admin code/)
    })

    it('Arbitrary admin code for DELETE', async () => {
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'POST',
          body: {
            jws: await buildJWS(adminDid, '1B7F4C45-C0E8-4BF3-88E4-8F7C81AB3BEC', [
              exampleModelStreamId,
            ]),
          },
        })
      ).rejects.toThrow(/Unauthorized access: invalid\/already used admin code/)
    })

    it('Old code used with GET', async () => {
      const code = (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
      const now = new Date().getTime()
      MockDate.set(now + (1000 * 60 * 1 + 1000)) // One minute one second in the future
      expect(true).toBeTruthy()
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          headers: {
            authorization: `Authorization: Basic ${await buildJWS(adminDid, code)}`,
          },
        })
      ).rejects.toThrow(
        /Unauthorized access: expired admin code - admin codes are only valid for 60 seconds/
      )
    })

    it('Old code used with POST', async () => {
      const code = (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
      const now = new Date().getTime()
      MockDate.set(now + (1000 * 60 * 1 + 1000)) // One minute one second in the future
      expect(true).toBeTruthy()
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'POST',
          body: { jws: await buildJWS(adminDid, code, [exampleModelStreamId]) },
        })
      ).rejects.toThrow(
        /Unauthorized access: expired admin code - admin codes are only valid for 60 seconds/
      )
    })

    it('Old code used with DELETE', async () => {
      const code = (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
      const now = new Date().getTime()
      MockDate.set(now + (1000 * 60 * 1 + 1000)) // One minute one second in the future
      expect(true).toBeTruthy()
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'DELETE',
          body: { jws: await buildJWS(adminDid, code, [exampleModelStreamId]) },
        })
      ).rejects.toThrow(
        /Unauthorized access: expired admin code - admin codes are only valid for 60 seconds/
      )
    })

    it('Same code used again for GET', async () => {
      const code = (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
      expect(true).toBeTruthy()
      await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
        headers: {
          authorization: `Authorization: Basic ${await buildJWS(adminDid, code)}`,
        },
      })
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          headers: {
            authorization: `Authorization: Basic ${await buildJWS(adminDid, code)}`,
          },
        })
      ).rejects.toThrow(/Unauthorized access: invalid\/already used admin code/)
    })

    it('Same code used again for POST', async () => {
      const code = (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
      expect(true).toBeTruthy()
      await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
        method: 'POST',
        body: { jws: await buildJWS(adminDid, code, [exampleModelStreamId]) },
      })
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'POST',
          body: { jws: await buildJWS(adminDid, code, [exampleModelStreamId]) },
        })
      ).rejects.toThrow(/Unauthorized access: invalid\/already used admin code/)
    })

    it('Same code used again for DELETE', async () => {
      const code = (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
      expect(true).toBeTruthy()
      await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
        method: 'DELETE',
        body: { jws: await buildJWS(adminDid, code, [exampleModelStreamId]) },
      })
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'DELETE',
          body: { jws: await buildJWS(adminDid, code, [exampleModelStreamId]) },
        })
      ).rejects.toThrow(/Unauthorized access: invalid\/already used admin code/)
    })

    it('Unauthorised DID for GET', async () => {
      const code = (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          headers: {
            authorization: `Authorization: Basic ${await buildJWS(nonAdminDid, code)}`,
          },
        })
      ).rejects.toThrow(/Unauthorized access/)
    })

    it('Unauthorised DID for POST', async () => {
      const code = (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'POST',
          body: { jws: await buildJWS(nonAdminDid, code, [exampleModelStreamId]) },
        })
      ).rejects.toThrow(/Unauthorized access/)
    })

    it('Unauthorised DID for DELETE', async () => {
      const code = (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'DELETE',
          body: { jws: await buildJWS(nonAdminDid, code, [exampleModelStreamId]) },
        })
      ).rejects.toThrow(/Unauthorized access/)
    })

    it('No authorization for GET', async () => {
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`)
      ).rejects.toThrow(/Missing authorization header/)
    })

    it('No authorization for POST', async () => {
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'POST',
        })
      ).rejects.toThrow(/Missing authorization jws/)
    })

    it('No authorization for DELETE', async () => {
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'DELETE',
        })
      ).rejects.toThrow(/Missing authorization jws/)
    })

    it('No models for POST', async () => {
      const code = (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'POST',
          body: { jws: await buildJWS(adminDid, code) },
        })
      ).rejects.toThrow(
        /The 'models' parameter is required and it has to be an array containing at least one model stream id/
      )
    })

    it('Empty models for POST', async () => {
      const code = (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'POST',
          body: { jws: await buildJWS(adminDid, code, []) },
        })
      ).rejects.toThrow(
        /The 'models' parameter is required and it has to be an array containing at least one model stream id/
      )
    })

    it('No models for DELETE', async () => {
      const code = (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'DELETE',
          body: { jws: await buildJWS(adminDid, code) },
        })
      ).rejects.toThrow(
        /The 'models' parameter is required and it has to be an array containing at least one model stream id/
      )
    })

    it('Empty models for DELETE', async () => {
      const code = (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'DELETE',
          body: { jws: await buildJWS(adminDid, code, []) },
        })
      ).rejects.toThrow(
        /The 'models' parameter is required and it has to be an array containing at least one model stream id/
      )
    })
  })
})
