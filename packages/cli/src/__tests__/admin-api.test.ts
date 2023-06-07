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
import { Model, type ModelDefinition } from '@ceramicnetwork/stream-model'
import { StreamID } from '@ceramicnetwork/streamid'

const seed = 'ADMINSEED'
const MY_MODEL_1_CONTENT: ModelDefinition = {
  name: 'myModel1',
  version: Model.VERSION,
  schema: {},
  accountRelation: { type: 'list' },
}

const MODEL_PATH = '/api/v0/admin/models'
const STATUS_PATH = '/api/v0/admin/status'

function modelIDsAsRequestBody(modelIDs: Array<string>): Record<string, Array<string>> | undefined {
  return modelIDs ? { models: modelIDs } : undefined
}

describe('admin api', () => {
  let daemon: CeramicDaemon
  let adminDid: DID
  let nonAdminDid: DID
  let ipfs: IpfsApi
  let tmpFolder: tmp.DirectoryResult
  let core: Ceramic
  let client: CeramicClient
  let exampleModelStreamId: string

  beforeEach(async () => {
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

  afterEach(async () => {
    await ipfs.stop()
    await client.close()
    await daemon.close()
    await core.close()
    await tmpFolder.cleanup()
  })

  async function buildJWS(
    did: DID,
    code: string,
    requestPath,
    models?: Array<string>
  ): Promise<string> {
    const body = modelIDsAsRequestBody(models)
    const jws = await did.createJWS({
      code: code,
      requestPath,
      requestBody: body,
    })
    return `${jws.signatures[0].protected}.${jws.payload}.${jws.signatures[0].signature}`
  }

  async function buildJWSPins(did: DID, code: string, requestPath: string): Promise<string> {
    const body = undefined
    const jws = await did.createJWS({
      code: code,
      requestPath: requestPath,
      requestBody: body,
    })
    return `${jws.signatures[0].protected}.${jws.payload}.${jws.signatures[0].signature}`
  }

  it('admin API CRUD test', async () => {
    const statusURLString = `http://localhost:${daemon.port}/api/v0/admin/status`
    const modelsURLString = `http://localhost:${daemon.port}/api/v0/admin/models`

    const fetchCode = async (): Promise<string> => {
      return (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
    }

    const statusResult = await fetchJson(statusURLString, {
      headers: {
        authorization: `Authorization: Basic ${await buildJWS(
          adminDid,
          await fetchCode(),
          STATUS_PATH
        )}`,
      },
    })
    expect(statusResult).not.toBeNull()

    const getResult = await fetchJson(modelsURLString, {
      headers: {
        authorization: `Authorization: Basic ${await buildJWS(
          adminDid,
          await fetchCode(),
          MODEL_PATH
        )}`,
      },
    })
    expect(getResult.models).toEqual([])

    const postResult = await fetchJson(modelsURLString, {
      method: 'POST',
      body: {
        jws: await buildJWS(adminDid, await fetchCode(), MODEL_PATH, [exampleModelStreamId]),
      },
    })
    expect(postResult.result).toEqual('success')

    const newGetResult = await fetchJson(modelsURLString, {
      headers: {
        authorization: `Authorization: Basic ${await buildJWS(
          adminDid,
          await fetchCode(),
          MODEL_PATH
        )}`,
      },
    })
    expect(newGetResult.models).toEqual([exampleModelStreamId])

    const deleteResult = await fetchJson(modelsURLString, {
      method: 'DELETE',
      body: {
        jws: await buildJWS(adminDid, await fetchCode(), MODEL_PATH, [exampleModelStreamId]),
      },
    })
    expect(deleteResult.result).toEqual('success')

    const getResultAfterDelete = await fetchJson(modelsURLString, {
      headers: {
        authorization: `Authorization: Basic ${await buildJWS(
          adminDid,
          await fetchCode(),
          MODEL_PATH
        )}`,
      },
    })
    expect(getResultAfterDelete.models).toEqual([])
  })

  it('legacy pin API should warn', async () => {
    const legacyPinURLBaseString = `http://localhost:${daemon.port}/api/v0/pins`
    // Legacy Pin Add
    const postResult = await fetchJson(`${legacyPinURLBaseString}/${exampleModelStreamId}`, {
      method: 'POST',
    })
    expect(Object.keys(postResult).includes('warn')).toEqual(true)
  })

  it('admin pin API CRUD test', async () => {
    const adminPinURLBaseString = `http://localhost:${daemon.port}/api/v0/admin/pins`

    const fetchCode = (): Promise<string> =>
      fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`).then((r) => r.code)

    // Get list of pins
    const getResult = await fetchJson(adminPinURLBaseString, {
      headers: {
        authorization: `Authorization: Basic ${await buildJWSPins(
          adminDid,
          await fetchCode(),
          `/api/v0/admin/pins`
        )}`,
      },
    })
    expect(getResult.pinnedStreamIds).toEqual([exampleModelStreamId])

    // Get single pin
    const getIdResult = await fetchJson(`${adminPinURLBaseString}/${exampleModelStreamId}`, {
      headers: {
        authorization: `Authorization: Basic ${await buildJWSPins(
          adminDid,
          await fetchCode(),
          `/api/v0/admin/pins`
        )}`,
      },
    })
    expect(getIdResult.pinnedStreamIds).toEqual([exampleModelStreamId])

    // Delete pin
    const deleteResult = await fetchJson(`${adminPinURLBaseString}/${exampleModelStreamId}`, {
      method: 'DELETE',
      headers: {
        authorization: `Authorization: Basic ${await buildJWSPins(
          adminDid,
          await fetchCode(),
          `/api/v0/admin/pins`
        )}`,
      },
    })
    expect(deleteResult.isPinned).toEqual(false)
    expect(deleteResult.streamId).toEqual(exampleModelStreamId)

    // Get single pin after delete
    const getIdResultAfterDelete = await fetchJson(
      `${adminPinURLBaseString}/${exampleModelStreamId}`,
      {
        headers: {
          authorization: `Authorization: Basic ${await buildJWSPins(
            adminDid,
            await fetchCode(),
            `/api/v0/admin/pins`
          )}`,
        },
      }
    )
    expect(getIdResultAfterDelete.pinnedStreamIds).toEqual([])

    // Add pin
    const postResult = await fetchJson(`${adminPinURLBaseString}/${exampleModelStreamId}`, {
      method: 'POST',
      headers: {
        authorization: `Authorization: Basic ${await buildJWSPins(
          adminDid,
          await fetchCode(),
          `/api/v0/admin/pins`
        )}`,
      },
    })
    expect(postResult.isPinned).toEqual(true)
    expect(postResult.streamId).toEqual(exampleModelStreamId)

    // Get single pin after adding
    const getIdResultAfterPost = await fetchJson(
      `${adminPinURLBaseString}/${exampleModelStreamId}`,
      {
        headers: {
          authorization: `Authorization: Basic ${await buildJWSPins(
            adminDid,
            await fetchCode(),
            `/api/v0/admin/pins`
          )}`,
        },
      }
    )
    expect(getIdResultAfterPost.pinnedStreamIds).toEqual([exampleModelStreamId])
  })

  describe('admin API validation test', () => {
    it('No admin code for nodeStatus GET', async () => {
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/status`, {
          headers: {
            authorization: `Authorization: Basic ${await buildJWS(adminDid, '', STATUS_PATH)}`,
          },
        })
      ).rejects.toThrow(/Admin code is missing from the the jws block/)
    })

    it('No admin code for models GET', async () => {
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          headers: {
            authorization: `Authorization: Basic ${await buildJWS(adminDid, '', MODEL_PATH)}`,
          },
        })
      ).rejects.toThrow(/Admin code is missing from the the jws block/)
    })

    it('No admin code for models POST', async () => {
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'POST',
          body: { jws: await buildJWS(adminDid, '', MODEL_PATH) },
        })
      ).rejects.toThrow(/Admin code is missing from the the jws block/)
    })

    it('No admin code for models DELETE', async () => {
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'POST',
          body: { jws: await buildJWS(adminDid, '', MODEL_PATH) },
        })
      ).rejects.toThrow(/Admin code is missing from the the jws block/)
    })

    it('Arbitrary admin code for status GET', async () => {
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/status`, {
          headers: {
            authorization: `Authorization: Basic ${await buildJWS(
              adminDid,
              '1B7F4C45-C0E8-4BF3-88E4-8F7C81AB3BEC',
              STATUS_PATH
            )}`,
          },
        })
      ).rejects.toThrow(/Unauthorized access: invalid\/already used admin code/)
    })

    it('Arbitrary admin code for models GET', async () => {
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          headers: {
            authorization: `Authorization: Basic ${await buildJWS(
              adminDid,
              '1B7F4C45-C0E8-4BF3-88E4-8F7C81AB3BEC',
              MODEL_PATH
            )}`,
          },
        })
      ).rejects.toThrow(/Unauthorized access: invalid\/already used admin code/)
    })

    it('Arbitrary admin code for models POST', async () => {
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'POST',
          body: {
            jws: await buildJWS(adminDid, '1B7F4C45-C0E8-4BF3-88E4-8F7C81AB3BEC', MODEL_PATH, [
              exampleModelStreamId,
            ]),
          },
        })
      ).rejects.toThrow(/Unauthorized access: invalid\/already used admin code/)
    })

    it('Arbitrary admin code for models DELETE', async () => {
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'POST',
          body: {
            jws: await buildJWS(adminDid, '1B7F4C45-C0E8-4BF3-88E4-8F7C81AB3BEC', MODEL_PATH, [
              exampleModelStreamId,
            ]),
          },
        })
      ).rejects.toThrow(/Unauthorized access: invalid\/already used admin code/)
    })

    it('Old code used with status GET', async () => {
      const code = (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
      const now = new Date().getTime()
      MockDate.set(now + (1000 * 60 * 1 + 1000)) // One minute one second in the future
      expect(true).toBeTruthy()
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/status`, {
          headers: {
            authorization: `Authorization: Basic ${await buildJWS(adminDid, code, STATUS_PATH)}`,
          },
        })
      ).rejects.toThrow(
        /Unauthorized access: expired admin code - admin codes are only valid for 60 seconds/
      )
    })

    it('Old code used with models GET', async () => {
      const code = (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
      const now = new Date().getTime()
      MockDate.set(now + (1000 * 60 + 1000)) // One minute one second in the future
      expect(true).toBeTruthy()
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          headers: {
            authorization: `Authorization: Basic ${await buildJWS(adminDid, code, MODEL_PATH)}`,
          },
        })
      ).rejects.toThrow(
        /Unauthorized access: expired admin code - admin codes are only valid for 60 seconds/
      )
    })

    it('Old code used with models POST', async () => {
      const code = (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
      const now = new Date().getTime()
      MockDate.set(now + (1000 * 60 * 1 + 1000)) // One minute one second in the future
      expect(true).toBeTruthy()
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'POST',
          body: { jws: await buildJWS(adminDid, code, MODEL_PATH, [exampleModelStreamId]) },
        })
      ).rejects.toThrow(
        /Unauthorized access: expired admin code - admin codes are only valid for 60 seconds/
      )
    })

    it('Old code used with models DELETE', async () => {
      const code = (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
      const now = new Date().getTime()
      MockDate.set(now + (1000 * 60 * 1 + 1000)) // One minute one second in the future
      expect(true).toBeTruthy()
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'DELETE',
          body: { jws: await buildJWS(adminDid, code, MODEL_PATH, [exampleModelStreamId]) },
        })
      ).rejects.toThrow(
        /Unauthorized access: expired admin code - admin codes are only valid for 60 seconds/
      )
    })

    it('Same code used again for status GET', async () => {
      const code = (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
      expect(true).toBeTruthy()
      await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/status`, {
        headers: {
          authorization: `Authorization: Basic ${await buildJWS(adminDid, code, STATUS_PATH)}`,
        },
      })
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/status`, {
          headers: {
            authorization: `Authorization: Basic ${await buildJWS(adminDid, code, STATUS_PATH)}`,
          },
        })
      ).rejects.toThrow(/Unauthorized access: invalid\/already used admin code/)
    })

    it('Same code used again for models GET', async () => {
      const code = (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
      expect(true).toBeTruthy()
      await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
        headers: {
          authorization: `Authorization: Basic ${await buildJWS(adminDid, code, MODEL_PATH)}`,
        },
      })
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          headers: {
            authorization: `Authorization: Basic ${await buildJWS(adminDid, code, MODEL_PATH)}`,
          },
        })
      ).rejects.toThrow(/Unauthorized access: invalid\/already used admin code/)
    })

    it('Same code used again for models POST', async () => {
      const code = (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
      expect(true).toBeTruthy()
      await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
        method: 'POST',
        body: { jws: await buildJWS(adminDid, code, MODEL_PATH, [exampleModelStreamId]) },
      })
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'POST',
          body: { jws: await buildJWS(adminDid, code, MODEL_PATH, [exampleModelStreamId]) },
        })
      ).rejects.toThrow(/Unauthorized access: invalid\/already used admin code/)
    })

    it('Same code used again for models DELETE', async () => {
      const code = (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
      expect(true).toBeTruthy()
      await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
        method: 'DELETE',
        body: { jws: await buildJWS(adminDid, code, MODEL_PATH, [exampleModelStreamId]) },
      })
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'DELETE',
          body: { jws: await buildJWS(adminDid, code, MODEL_PATH, [exampleModelStreamId]) },
        })
      ).rejects.toThrow(/Unauthorized access: invalid\/already used admin code/)
    })

    it('Unauthorised DID for status GET', async () => {
      const code = (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/status`, {
          headers: {
            authorization: `Authorization: Basic ${await buildJWS(nonAdminDid, code, STATUS_PATH)}`,
          },
        })
      ).rejects.toThrow(/Unauthorized access/)
    })

    it('Unauthorised DID for models GET', async () => {
      const code = (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          headers: {
            authorization: `Authorization: Basic ${await buildJWS(nonAdminDid, code, MODEL_PATH)}`,
          },
        })
      ).rejects.toThrow(/Unauthorized access/)
    })

    it('Unauthorised DID for models POST', async () => {
      const code = (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'POST',
          body: { jws: await buildJWS(nonAdminDid, code, MODEL_PATH, [exampleModelStreamId]) },
        })
      ).rejects.toThrow(/Unauthorized access/)
    })

    it('Unauthorised DID for models DELETE', async () => {
      const code = (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'DELETE',
          body: { jws: await buildJWS(nonAdminDid, code, MODEL_PATH, [exampleModelStreamId]) },
        })
      ).rejects.toThrow(/Unauthorized access/)
    })

    it('No authorization for status GET', async () => {
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/status`)
      ).rejects.toThrow(/Missing authorization header/)
    })

    it('No authorization for models GET', async () => {
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`)
      ).rejects.toThrow(/Missing authorization header/)
    })

    it('No authorization for models POST', async () => {
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'POST',
        })
      ).rejects.toThrow(/Missing authorization jws/)
    })

    it('No authorization for models DELETE', async () => {
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'DELETE',
        })
      ).rejects.toThrow(/Missing authorization jws/)
    })

    it('No models for models POST', async () => {
      const code = (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'POST',
          body: { jws: await buildJWS(adminDid, code, MODEL_PATH) },
        })
      ).rejects.toThrow(/Expected models to be present/)
    })

    it('Empty models for models POST', async () => {
      const code = (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'POST',
          body: { jws: await buildJWS(adminDid, code, MODEL_PATH, []) },
        })
      ).rejects.toThrow(/Expected models to be present/)
    })

    it('No models for models DELETE', async () => {
      const code = (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'DELETE',
          body: { jws: await buildJWS(adminDid, code, MODEL_PATH) },
        })
      ).rejects.toThrow(/Expected models to be present/)
    })

    it('Empty models for models DELETE', async () => {
      const code = (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'DELETE',
          body: { jws: await buildJWS(adminDid, code, MODEL_PATH, []) },
        })
      ).rejects.toThrow(/Expected models to be present/)
    })

    it('Disallow re-indexing on POST', async () => {
      const fetchCode = async (): Promise<string> => {
        return (await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/getCode`)).code
      }

      expect(true).toBeTruthy()
      const postResult = await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
        method: 'POST',
        body: {
          jws: await buildJWS(adminDid, await fetchCode(), MODEL_PATH, [exampleModelStreamId]),
        },
      })
      expect(postResult.result).toEqual('success')

      const deleteResult = await fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
        method: 'DELETE',
        body: {
          jws: await buildJWS(adminDid, await fetchCode(), MODEL_PATH, [exampleModelStreamId]),
        },
      })
      expect(deleteResult.result).toEqual('success')

      await expect(
        fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, {
          method: 'POST',
          body: {
            jws: await buildJWS(adminDid, await fetchCode(), MODEL_PATH, [exampleModelStreamId]),
          },
        })
      ).rejects.toThrow(
        /Cannot re-index model kjzl6hvfrbw6c9jjl42rrylkpibnt1mjf52900nnwkt68ci1kuoc51hncgczs5q, data may not be up-to-date/
      )
    })
  })
})
