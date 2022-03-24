import type { StreamMetadata } from '@ceramicnetwork/common'
import { DataSource, type Repository } from 'typeorm'

import { Controller } from './entities/controller.js'
import { Stream } from './entities/stream.js'
import { Tag } from './entities/tag.js'
import { formatSchema } from './utils.js'

type DBRepository<T> = Repository<T> & {
  add(input: unknown): Promise<T>
}

export type StreamInfo = {
  id: string
  tip: string
  metadata: StreamMetadata
}

export type DataSourceConfig =
  | {
      type: 'postgres'
      host: string
      port: number
      username: string
      password: string
      database: string
    }
  | {
      type: 'sqlite'
      database: string
    }

export class DataBase {
  #initialized: Promise<void>

  dataSource: DataSource
  streams: DBRepository<Stream>

  constructor(config: DataSourceConfig) {
    this.dataSource = new DataSource({
      ...config,
      entities: [Controller, Stream, Tag],
      synchronize: true,
    })
    this.#initialized = this.dataSource.initialize().then()

    const controllersRepository = this.dataSource.getRepository(Controller)
    const tagsRepository = this.dataSource.getRepository(Tag)

    this.streams = this.dataSource.getRepository(Stream).extend({
      async add(stream: StreamInfo): Promise<Stream> {
        const metaTags = stream.metadata.tags ?? []
        const [controllers, tags] = await Promise.all([
          Promise.all(
            stream.metadata.controllers.map(async (value) => {
              const upsertResult = await controllersRepository.upsert({ value }, ['value'])
              return upsertResult.identifiers[0]
            })
          ),
          Promise.all(
            metaTags.map(async (value) => {
              const upsertResult = await tagsRepository.upsert({ value }, ['value'])
              return upsertResult.identifiers[0]
            })
          ),
        ])

        return await this.save({
          id: stream.id,
          tip: stream.tip,
          isDeterministic: !stream.metadata.unique,
          family: stream.metadata.family,
          schema: formatSchema(stream.metadata.schema),
          controllers,
          tags,
          inlineTags: metaTags.map((t) => t.replace('#', '')).join('#'),
        })
      },
    })
  }

  get initialized(): Promise<void> {
    return this.#initialized
  }
}
