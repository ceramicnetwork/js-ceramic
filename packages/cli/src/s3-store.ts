import { IKVStore, IKVStoreFindResult, StoreSearchParams } from '@ceramicnetwork/core'
import LevelUp from 'levelup'
import S3LevelDOWN from 's3leveldown'
import toArray from 'stream-to-array'
import PQueue from 'p-queue'
import AWSSDK from 'aws-sdk'

/**
 * Maximum GET/HEAD requests per second to AWS S3
 */
const MAX_LOAD_RPS = 4000
const DEFAULT_S3_STORE_USE_CASE_NAME = 'default'

class S3StoreMap {
  readonly #storeRoot: string
  readonly #defaultLocation: string
  readonly networkName: string
  readonly #map: Map<string, LevelUp.LevelUp>
  readonly #customEndpoint: string | undefined

  constructor(networkName: string, bucketName: string, customEndpoint?: string) {
    this.networkName = networkName
    this.#storeRoot = bucketName + '/ceramic/' + this.networkName
    this.#defaultLocation = 'state-store'
    this.#map = new Map<string, LevelUp.LevelUp>()
    this.#customEndpoint = customEndpoint
  }

  createStore(useCaseName = DEFAULT_S3_STORE_USE_CASE_NAME): LevelUp.LevelUp {
    // Different S3 stores live at different urls (named based use-cases with the default being <bucketName + '/ceramic/' + this.networkName + '/state-store'>
    // and others being `<bucketName + '/ceramic/' + this.networkName + '/state-store-<useCaseName>` with useCaseNames passed as params by owners of the store map) in #storeRoot
    const fullLocation = this.getFullLocation(useCaseName)
    const storePath = `${this.#storeRoot}/${fullLocation}`

    const levelDown = this.#customEndpoint
      ? new S3LevelDOWN(
          storePath,
          new AWSSDK.S3({
            endpoint: this.#customEndpoint,
          })
        )
      : new S3LevelDOWN(storePath)

    const levelUp = new LevelUp(levelDown)
    this.#map.set(fullLocation, levelUp)
    return levelUp
  }

  private getFullLocation(useCaseName = DEFAULT_S3_STORE_USE_CASE_NAME): string {
    if (useCaseName === DEFAULT_S3_STORE_USE_CASE_NAME) {
      return this.#defaultLocation
    } else {
      return `${this.#defaultLocation}-${useCaseName}`
    }
  }

  get(useCaseName?: string): LevelUp.LevelUp {
    const location = this.#map.get(this.getFullLocation(useCaseName))
    if (location) return location
    return this.createStore(useCaseName)
  }

  values(): IterableIterator<LevelUp.LevelUp> {
    return this.#map.values()
  }
}

export class S3Store implements IKVStore {
  readonly #storeMap: S3StoreMap

  readonly #loadingLimit = new PQueue({
    intervalCap: MAX_LOAD_RPS,
    interval: 1000,
    carryoverConcurrencyCount: true,
  })

  constructor(networkName: string, bucketName: string, customEndpoint?: string) {
    this.#storeMap = new S3StoreMap(networkName, bucketName, customEndpoint)
  }

  get networkName(): string {
    return this.#storeMap.networkName
  }

  async close(useCaseName?: string): Promise<void> {
    const store = this.#storeMap.get(useCaseName)
    await store.close()
  }

  async isEmpty(params?: StoreSearchParams): Promise<boolean> {
    const result = await this.findKeys({
      limit: 1,
      ...params,
    })
    return result.length > 0
  }

  async exists(key: string, useCaseName?: string): Promise<boolean> {
    const store = this.#storeMap.get(useCaseName)
    try {
      const value = await store.get(key)
      return value !== undefined
    } catch (e: any) {
      if (/Key not found in database/.test(e.toString())) {
        return false
      } else {
        throw e
      }
    }
  }

  async find(params?: StoreSearchParams): Promise<Array<IKVStoreFindResult>> {
    const store = this.#storeMap.get(params?.useCaseName)
    const options = {
      limit: params?.limit,
    }
    if (params?.gt) (options as any).gt = params.gt
    const dataArray = await toArray(store.createReadStream(options))
    return dataArray.map((data) => {
      return { key: data.key.toString(), value: JSON.parse(data.value.toString()) }
    })
  }

  async findKeys(params?: StoreSearchParams): Promise<Array<string>> {
    const store = this.#storeMap.get(params?.useCaseName)
    const bufArray = await toArray(
      store.createKeyStream({
        limit: params?.limit,
      })
    )
    return bufArray.map((buf) => buf.toString())
  }

  async get(key: string, useCaseName?: string): Promise<any> {
    return this.#loadingLimit.add(async () => {
      const store = this.#storeMap.get(useCaseName)
      const value = await store.get(key)
      return JSON.parse(value)
    })
  }

  async put(key: string, value: any, useCaseName?: string): Promise<void> {
    const store = this.#storeMap.get(useCaseName)
    await store.put(key, JSON.stringify(value))
  }

  async del(key: string, useCaseName?: string): Promise<void> {
    const store = this.#storeMap.get(useCaseName)
    await store.del(key)
  }
}
