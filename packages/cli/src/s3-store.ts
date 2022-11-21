import { IKVStore, IKVStoreFindResult, StoreSearchParams } from '@ceramicnetwork/core'
import LevelUp from 'levelup'
import S3LevelDOWN from 's3leveldown'
import toArray from 'stream-to-array'
import PQueue from 'p-queue'
import { Networks } from '@ceramicnetwork/common'
import path from 'path'
import fs from 'fs'

/**
 * Maximum GET/HEAD requests per second to AWS S3
 */
const MAX_LOAD_RPS = 4000
const DEFAULT_S3_STORE_USE_CASE_NAME = 'default'

class S3StoreMap {
  readonly #storeRoot
  readonly networkName: string
  readonly #map: Map<string, LevelUp.LevelUp>

  constructor(bucketName: string, networkName: string) {
    this.networkName = networkName
    this.#storeRoot = bucketName + '/ceramic/' + this.networkName
    this.#map = new Map<string, LevelUp.LevelUp>()
  }

  createStore(useCaseName = DEFAULT_S3_STORE_USE_CASE_NAME) {
    // Different S3 stores live at different urls (named based use-cases with the default being <bucketName + '/ceramic/' + this.networkName + '/state-store'>
    // and others being `<bucketName + '/ceramic/' + this.networkName + '/state-store-<useCaseName>` with useCaseNames passed as params by owners of the store map) in #storeRoot
    const fullLocation = this.getFullLocation(useCaseName)
    const storePath = `${this.#storeRoot}/${fullLocation}`
    // @ts-ignore
    this.#map.set(fullLocation, new LevelUp(new S3LevelDOWN(storePath)))
  }

  private getDefaultLocation(): string {
    return 'state-store'
  }

  private getFullLocation(useCaseName = DEFAULT_S3_STORE_USE_CASE_NAME): string {
    if (useCaseName === DEFAULT_S3_STORE_USE_CASE_NAME) {
      return this.getDefaultLocation()
    } else {
      return `${this.getDefaultLocation()}-${useCaseName}`
    }
  }

  async get(useCaseName?: string): Promise<LevelUp.LevelUp> {
    if (!this.#map.get(this.getFullLocation(useCaseName))) {
      await this.createStore(useCaseName)
    }
    return this.#map.get(this.getFullLocation(useCaseName))
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

  constructor(bucketName: string, networkName: string) {
    this.#storeMap = new S3StoreMap(bucketName, networkName)
  }

  get networkName(): string {
    return this.#storeMap.networkName
  }

  async close(useCaseName?: string): Promise<void> {
    await (await this.#storeMap.get(useCaseName)).close()
  }

  async isEmpty(params?: StoreSearchParams): Promise<boolean> {
    const result = await this.findKeys({
      limit: 1,
      ...params,
    })
    return result.length > 0
  }

  async find(params?: StoreSearchParams): Promise<Array<IKVStoreFindResult>> {
    const dataArray = await toArray(
      (await this.#storeMap.get(params?.useCaseName)).createReadStream({
        limit: params?.limit,
      })
    )
    return dataArray.map((data) => { return { key: data.key.toString(), value: data.value } })
  }

  async findKeys(params?: StoreSearchParams): Promise<Array<string>> {
    const bufArray = await toArray(
      (await this.#storeMap.get(params?.useCaseName)).createKeyStream({
        limit: params?.limit,
      })
    )
    return bufArray.map((buf) => buf.toString())
  }

  async get(key: string, useCaseName?: string): Promise<any> {
    return this.#loadingLimit.add(async () => {
      return JSON.parse(await (await this.#storeMap.get(useCaseName)).get(key))
    })
  }

  async put(key: string, value: any, useCaseName?: string): Promise<void> {
    return (await this.#storeMap.get(useCaseName)).put(key, JSON.stringify(value))
  }

  async del(key: string, useCaseName?: string): Promise<void> {
    return (await this.#storeMap.get(useCaseName)).del(key)
  }
}
