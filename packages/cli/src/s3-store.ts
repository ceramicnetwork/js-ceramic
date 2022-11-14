import { StoreForNetwork, StoreSearchParams } from '@ceramicnetwork/core'
import LevelUp from 'levelup'
import S3LevelDOWN from 's3leveldown'
import toArray from 'stream-to-array'
import PQueue from 'p-queue'

/**
 * Maximum GET/HEAD requests per second to AWS S3
 */
const MAX_LOAD_RPS = 4000

export class S3Store implements StoreForNetwork {
  readonly networkName: string
  readonly #bucketName: string
  #store:  LevelUp.LevelUp
  readonly  #loadingLimit = new PQueue({
    intervalCap: MAX_LOAD_RPS,
    interval: 1000,
    carryoverConcurrencyCount: true,
  })

  constructor(bucketName: string, networkName: string) {
    this.#bucketName = bucketName
    this.networkName = networkName
  }

  private _throwIfNotInitialized(): void {
    if (!this.#store) throw new Error('You must call async init(), before you start using the S3Store')
  }

  async init(): Promise<void> {
    // TODO: CDB-XXXX Manage migration from `state-store` to 'storage'??
    const location = this.#bucketName + '/ceramic/' + this.networkName + '/storage'
    // @ts-ignore
    this.#store = new LevelUp(new S3LevelDOWN(location))
  }

  async isEmpty(params?: StoreSearchParams): Promise<boolean> {
    this._throwIfNotInitialized()
    const result = await this.find({
      limit: 1,
      ...params
    })
    return result.length > 0
  }

  async find(params?: StoreSearchParams): Promise<Array<string>> {
    this._throwIfNotInitialized()
    const bufArray = await toArray(this.#store.createKeyStream(params))
    return bufArray.map((buf) => buf.toString())
  }

  async get(key: string): Promise<string> {
    this._throwIfNotInitialized()
    return this.#loadingLimit.add(async () => {
      return JSON.parse(await this.#store.get(key))
    })
  }

  async put(key: string, value: string): Promise<void> {
    this._throwIfNotInitialized()
    return await this.#store.put(key, JSON.stringify(value))
  }

  async del(key: string): Promise<void> {
    this._throwIfNotInitialized()
    return await this.#store.del(key)
  }

  async close() {
    this._throwIfNotInitialized()
    await this.#store.close()
  }
}
