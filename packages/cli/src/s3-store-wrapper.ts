import { StoreWrapperInterface, StoreSearchParams } from '@ceramicnetwork/core'
import LevelUp from 'levelup'
import S3LevelDOWN from 's3leveldown'
import toArray from 'stream-to-array'
import PQueue from 'p-queue'

/**
 * Maximum GET/HEAD requests per second to AWS S3
 */
const MAX_LOAD_RPS = 4000

export class S3StoreWrapper implements StoreWrapperInterface {
  readonly networkName: string
  readonly #bucketName: string
  #store:  LevelUp.LevelUp
  #subStores: Record<string, LevelUp.LevelUp> = {}

  readonly  #loadingLimit = new PQueue({
    intervalCap: MAX_LOAD_RPS,
    interval: 1000,
    carryoverConcurrencyCount: true,
  })

  constructor(bucketName: string, networkName: string) {
    this.#bucketName = bucketName
    this.networkName = networkName
    const location = this.#bucketName + '/ceramic/' + this.networkName + '/state-store'
    // @ts-ignore
    this.#store = new LevelUp(new S3LevelDOWN(location))
  }

  private getLocation(subChannel?: string): string {
    const baseLocation = this.#bucketName + '/ceramic/' + this.networkName + '/state-store'
    return subChannel ? `${baseLocation}/${subChannel}` : baseLocation
  }

  private getStore(subChannel?: string): LevelUp.LevelUp {
    if (subChannel) {
      if (!this.#subStores[subChannel]) {
        // @ts-ignore
        this.#subStores[subChannel] = new LevelUp(new S3LevelDOWN(this.getLocation(subChannel)))
      }
      return this.#subStores[subChannel]
    } else {
      return this.#store
    }
  }

  async init(): Promise<void> {
    // @ts-ignore
    this.#store = new LevelUp(new S3LevelDOWN(this.getLocation()))
  }

  async isEmpty(params?: StoreSearchParams): Promise<boolean> {
    const result = await this.find({
      limit: 1,
      ... params
    })
    return result.length > 0
  }

  async find(params?: StoreSearchParams): Promise<Array<any>> {
    const bufArray = await toArray(
      this.getStore(params?.subChannel).createKeyStream({
        limit: params?.limit
      })
    )
    return bufArray.map((buf) => buf.toString())
  }

  async get(key: string, subChannel?: string): Promise<any> {
    return this.#loadingLimit.add(async () => {
      return await this.getStore(subChannel).get(key)
    })
  }

  async put(key: string, value: any, subChannel?: string): Promise<void> {
    return await this.getStore(subChannel).put(key, value)
  }

  async del(key: string, subChannel?: string): Promise<void> {
    return await this.getStore(subChannel).del(key)
  }

  async close() {
    await this.#store.close()
    for (const subStoresKey in this.#subStores) {
      await this.#subStores[subStoresKey].close()
    }
  }
}
