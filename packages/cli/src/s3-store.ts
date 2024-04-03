import { type DiagnosticsLogger, Networks } from '@ceramicnetwork/common'
import type { ChainedKVBatch, IKVFactory, IKVStore, IKVStoreFindResult, StoreSearchParams } from '@ceramicnetwork/core'
import LevelUp from 'levelup'
import S3LevelDOWN from 's3leveldown'
import toArray from 'stream-to-array'
import PQueue from 'p-queue'
import AWSSDK from 'aws-sdk'
import { Mutex } from 'await-semaphore'

/**
 * Maximum GET/HEAD requests per second to AWS S3
 */
const MAX_LOAD_RPS = 4000

export class S3KVFactory implements IKVFactory {
  readonly #networkName: string
  readonly #bucketName: string
  readonly #defaultLocation: string
  readonly #customEndpoint: string
  readonly #cache: Map<string, S3KVStore>
  readonly #createMutex: Mutex
  readonly #logger: DiagnosticsLogger

  constructor(
    bucketName: string,
    networkName: string,
    logger: DiagnosticsLogger,
    customEndpoint?: string
  ) {
    this.#bucketName = bucketName
    this.#networkName = networkName
    this.#defaultLocation = 'state-store'
    this.#customEndpoint = customEndpoint
    this.#cache = new Map()
    this.#logger = logger
    this.#createMutex = new Mutex()
  }

  storeRoot(networkName = this.#networkName) {
    return `${this.#bucketName}/ceramic/${networkName}`
  }

  async open(name?: string): Promise<S3KVStore> {
    const fromCache = this.#cache.get(name)
    if (fromCache) return fromCache
    return this.create(name)
  }

  create(name: string | undefined): Promise<S3KVStore> {
    return this.#createMutex.use(async () => {
      const fromCache = this.#cache.get(name)
      if (fromCache) return fromCache
      const storePath = await this.dirPath(name)
      const levelDown = this.#customEndpoint
        ? new S3LevelDOWN(
            storePath,
            new AWSSDK.S3({
              endpoint: this.#customEndpoint,
            })
          )
        : new S3LevelDOWN(storePath)
      const levelUp = new LevelUp(levelDown)
      const kv = new S3KVStore(levelUp)
      this.#cache.set(name, kv)
      return kv
    })
  }

  async dirPath(name: string | undefined) {
    let storeRoot = this.storeRoot()
    // Use "elp" store root if on mainnet and the folder is present
    if (this.#networkName === Networks.MAINNET) {
      const s3 = new AWSSDK.S3()
      const res = await s3
        .listObjectsV2({ Bucket: this.#bucketName, Prefix: 'ceramic/elp', MaxKeys: 1 })
        .promise()
      if (res.Contents?.length) {
        // state store exists and needs to be used
        this.#logger.warn(
          `S3 bucket found with ELP location, using it instead of default mainnet location for state store`
        )
        storeRoot = this.storeRoot('elp')
      }
    }

    if (name) {
      return `${storeRoot}/${this.#defaultLocation}-${name}`
    } else {
      return `${storeRoot}/${this.#defaultLocation}`
    }
  }

  async close(): Promise<void> {
    for (const store of this.#cache.values()) {
      await store.close()
    }
  }
}

class S3KVStore implements IKVStore {
  readonly level: LevelUp.LevelUp

  readonly #loadingLimit: PQueue

  constructor(level: LevelUp.LevelUp) {
    this.level = level
    this.#loadingLimit = new PQueue({
      intervalCap: MAX_LOAD_RPS,
      interval: 1000,
      carryoverConcurrencyCount: true,
    })
  }

  close(): Promise<void> {
    return this.level.close()
  }

  batch(): ChainedKVBatch {
    return this.level.batch() as any // Same interface despite TS complaints
  }

  async isEmpty(params?: Partial<StoreSearchParams>): Promise<boolean> {
    const result = await this.findKeys({
      limit: 1,
      ...params,
    })
    return result.length > 0
  }

  async findKeys(params?: Partial<StoreSearchParams>): Promise<string[]> {
    const bufArray = await toArray(
      this.level.createKeyStream({
        limit: params?.limit,
      })
    )
    return bufArray.map((buf) => buf.toString())
  }

  async find(params?: Partial<StoreSearchParams>): Promise<IKVStoreFindResult[]> {
    const options = {
      limit: params?.limit,
    }
    if (params?.gt) (options as any).gt = params.gt
    const dataArray = await toArray(this.level.createReadStream(options))
    return dataArray.map((data) => {
      return { key: data.key.toString(), value: JSON.parse(data.value.toString()) }
    })
  }

  async exists(key: string): Promise<boolean> {
    try {
      const value = await this.level.get(key)
      return value !== undefined
    } catch (e) {
      if (/Key not found in database/.test(e.toString())) {
        return false
      } else {
        throw e
      }
    }
  }

  put(key: string, value: any): Promise<void> {
    return this.level.put(key, JSON.stringify(value))
  }

  get(key: string): Promise<any> {
    return this.#loadingLimit.add(async () => {
      const value = await this.level.get(key)
      return JSON.parse(value)
    })
  }

  del(key: string): Promise<void> {
    return this.level.del(key)
  }
}
