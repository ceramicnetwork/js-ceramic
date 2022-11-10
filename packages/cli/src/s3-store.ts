import { StoreForNetwork, StoreSearchParams } from '@ceramicnetwork/core'
import LevelUp from 'levelup'
import S3LevelDOWN from 's3leveldown'
import toArray from 'stream-to-array'

export class S3Store implements StoreForNetwork {
  readonly networkName: string
  readonly #bucketName: string
  #store:  LevelUp.LevelUp

  constructor(bucketName: string, networkName: string) {
    this.#bucketName = bucketName
    this.networkName = networkName
  }

  async init(): Promise<void> {
    const location = this.#bucketName + '/ceramic/' + this.networkName + '/state-store'
    // @ts-ignore
    this.#store = new LevelUp(new S3LevelDOWN(location))
  }

  async isEmpty(params?: StoreSearchParams): Promise<boolean> {
    const result = await this.find({
      limit: 1,
      ...params
    })
    return result.length > 0
  }

  async find(params?: StoreSearchParams): Promise<Array<string>> {
    const bufArray = await toArray(this.#store.createKeyStream(params))
    return bufArray.map((buf) => buf.toString())
  }

  async get(key: string): Promise<string> {
    return await this.#store.get(key)
  }

  async put(key: string, value: string): Promise<void> {
    return await this.#store.put(key, value)
  }

  async del(key: string): Promise<void> {
    return await this.#store.del(key)
  }

  async close() {
    await this.#store.close()
  }
}
