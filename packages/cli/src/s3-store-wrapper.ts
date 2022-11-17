import { StoreWrapperInterface, StoreSearchParams } from '@ceramicnetwork/core'
import LevelUp from 'levelup'
import S3LevelDOWN from 's3leveldown'
import toArray from 'stream-to-array'
import PQueue from 'p-queue'

/**
 * Maximum GET/HEAD requests per second to AWS S3
 */
const MAX_LOAD_RPS = 4000

class S3StoreMap {
  readonly networkName: string
  readonly #bucketName: string
  readonly #map: Map<string, LevelUp.LevelUp>

  constructor(bucketName: string, networkName: string) {
    this.networkName = networkName
    this.#bucketName = bucketName
    this.#map = new Map<string, LevelUp.LevelUp>()
    // @ts-ignore
    this.#map.set(this.getBaseLocation(), new LevelUp(new S3LevelDOWN(this.getBaseLocation())))
  }

  getBaseLocation(): string {
    return this.#bucketName + '/ceramic/' + this.networkName + '/state-store'
  }

  private getFullLocation(subdirectoryName?: string): string {
    if (subdirectoryName) {
      return `${this.getBaseLocation()}/${subdirectoryName}`
    } else {
      return this.getBaseLocation()
    }
  }

  get(subdirectoryName?: string): LevelUp.LevelUp {
    const fullLocation = this.getFullLocation(subdirectoryName)
    if (!this.#map.get(fullLocation)) {
      // @ts-ignore
      this.#map.set(fullLocation, new LevelUp(new S3LevelDOWN(fullLocation)))
    }
    return this.#map.get(fullLocation)
  }

  values(): IterableIterator<LevelUp.LevelUp> {
    return this.#map.values()
  }
}

export class S3StoreWrapper implements StoreWrapperInterface {
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

  async isEmpty(params?: StoreSearchParams): Promise<boolean> {
    const result = await this.find({
      limit: 1,
      ...params,
    })
    return result.length > 0
  }

  async find(params?: StoreSearchParams): Promise<Array<any>> {
    const bufArray = await toArray(
      this.#storeMap.get(params?.subChannel).createKeyStream({
        limit: params?.limit,
      })
    )
    return bufArray.map((buf) => buf.toString())
  }

  async get(key: string, subChannel?: string): Promise<any> {
    return this.#loadingLimit.add(async () => {
      return await this.#storeMap.get(subChannel).get(key)
    })
  }

  async put(key: string, value: any, subChannel?: string): Promise<void> {
    return await this.#storeMap.get(subChannel).put(key, value)
  }

  async del(key: string, subChannel?: string): Promise<void> {
    return await this.#storeMap.get(subChannel).del(key)
  }

  async close() {
    for (const store of this.#storeMap.values()) {
      await store.close()
    }
  }
}
