import { Stream as CeramicStream } from '@ceramicnetwork/common'
import { type FindManyOptions, type FindOperator, IsNull, Like, Not } from 'typeorm'

import { DataBase, type DataSourceConfig, type StreamInfo } from './db.js'
import type { Stream } from './entities/stream.js'
import { formatSchema } from './utils.js'

const DEFAULT_RESULTS = 50
const MAX_RESULTS = 200

function withSchema(schema?: string): FindOperator<any> | string {
  return schema == null || schema === '*' ? Not(IsNull()) : formatSchema(schema)
}

export type IndexingServiceConfig = {
  db: DataBase | DataSourceConfig
}

export type PaginationParams = {
  skip: number
  take: number
}

export type AccountParams = Partial<PaginationParams> & {
  account: string
}

export type AccountFamilyParams = AccountParams & {
  family: string
  schema?: string
}

export type CollectionParams = Partial<PaginationParams> & {
  deterministic: boolean // required as different semantics for family
  family: string // main identifier for collection
  account?: string // optional filter by controller
  schema?: string // optional schema, can use '*' for non-null
  tag?: boolean | string // optional tag
}

export type DefinitionAccountRecordsParams = Partial<PaginationParams> & {
  definitionID: string
}

export type AccountIndexResults = {
  records: Array<{ definitionID: string; recordID: string }>
  total: number
}

export type AccountRecordsResults = {
  records: Array<{ id: string; tags: Array<string> }>
  total: number
}

export type AccountLinksResults = {
  links: Array<string>
  total: number
}

export type CollectionResult = {
  id: string
  schema: string | undefined
  controllers: Array<string>
  tags: Array<string>
}
export type CollectionResults = {
  collection: Array<CollectionResult>
  total: number
}

export type DefinitionAccountRecordsResults = {
  records: Array<{ account: string; recordID: string }>
  total: number
}

export class IndexingService {
  #db: DataBase

  constructor(config: IndexingServiceConfig) {
    this.#db = config.db instanceof DataBase ? config.db : new DataBase(config.db)
  }

  _getPaginationParams(partial: Partial<PaginationParams>): PaginationParams {
    return { skip: partial.skip ?? 0, take: Math.min(partial.take ?? DEFAULT_RESULTS, MAX_RESULTS) }
  }

  async _findStreams(options: FindManyOptions<Stream>): Promise<[Array<Stream>, number]> {
    await this.#db.initialized
    return await this.#db.streams.findAndCount({
      ...options,
      ...this._getPaginationParams(options),
    })
  }

  async index(stream: CeramicStream | StreamInfo): Promise<void> {
    await this.#db.initialized
    const streamInfo =
      stream instanceof CeramicStream
        ? { id: stream.id.toString(), tip: stream.tip.toString(), metadata: stream.metadata }
        : stream
    await this.#db.streams.add(streamInfo)
  }

  // Account-centric queries

  // Equivalent to loading the IDX index stream
  async getAccountIndex({ account, ...pagination }: AccountParams): Promise<AccountIndexResults> {
    const [streams, total] = await this._findStreams({
      ...pagination,
      relations: {
        controllers: true,
      },
      where: {
        controllers: { value: account },
        isDeterministic: true,
        inlineTags: '',
        family: Not(IsNull()),
        schema: Not(IsNull()),
      },
      select: ['id', 'family'],
    })
    return {
      records: streams.map((s) => ({ definitionID: s.family, recordID: s.id })),
      total,
    }
  }

  async getAccountRecords({
    account,
    family,
    schema,
    ...pagination
  }: AccountFamilyParams): Promise<AccountRecordsResults> {
    const [streams, total] = await this._findStreams({
      ...pagination,
      relations: {
        controllers: true,
        tags: true,
      },
      where: {
        controllers: { value: account },
        family,
        isDeterministic: false,
        schema: withSchema(schema),
      },
      select: ['id', 'tags'],
    })
    return {
      records: streams.map((s) => ({ id: s.id, tags: s.tags.map((t) => t.value) })),
      total,
    }
  }

  async getAccountLinksFrom({
    account,
    family,
    schema,
    ...pagination
  }: AccountFamilyParams): Promise<AccountLinksResults> {
    const [streams, total] = await this._findStreams({
      ...pagination,
      relations: {
        controllers: true,
        tags: true,
      },
      where: {
        controllers: { value: account },
        family,
        isDeterministic: true,
        inlineTags: Like('did:%'),
        schema: withSchema(schema),
      },
      select: ['tags'],
    })
    return {
      links: streams.map((r) => r.tags[0].value),
      total,
    }
  }

  async getAccountLinksTo({
    account,
    family,
    schema,
    ...pagination
  }: AccountFamilyParams): Promise<AccountLinksResults> {
    const [streams, total] = await this._findStreams({
      ...pagination,
      relations: {
        controllers: true,
      },
      where: {
        family,
        isDeterministic: true,
        inlineTags: account,
        schema: withSchema(schema),
      },
      select: ['controllers'],
    })
    return {
      links: streams.flatMap((s) => s.controllers.map((c) => c.value)),
      total,
    }
  }

  // Family-centric queries

  // Generic collection lookup based on metadata
  async getCollection({
    account,
    deterministic,
    family,
    schema,
    tag,
    ...pagination
  }: CollectionParams): Promise<any> {
    const [streams, total] = await this._findStreams({
      ...pagination,
      relations: {
        controllers: true,
        tags: true,
      },
      where: {
        family,
        isDeterministic: deterministic,
        controllers: account == null ? undefined : { value: account },
        tags: tag == null || typeof tag === 'boolean' ? undefined : { value: tag },
        inlineTags: tag === true ? Not('') : '',
        schema: withSchema(schema),
      },
      select: ['id', 'controllers', 'tags', 'schema'],
    })
    return {
      collection: streams.map((s) => {
        return {
          id: s.id,
          controllers: s.controllers.map((c) => c.value),
          tags: s.tags.map((t) => t.value),
          schema: s.schema,
        }
      }),
      total,
    }
  }

  // This is complementary to getAccountIndex() but from the other side: for a given definition ID
  // we can get all the records with associated accounts
  async getDefinitionAccountRecords({
    definitionID,
    ...params
  }: DefinitionAccountRecordsParams): Promise<DefinitionAccountRecordsResults> {
    const res = await this.getCollection({
      ...params,
      family: definitionID,
      deterministic: true,
      tag: false,
    })
    return {
      records: res.collection.map((s) => ({ account: s.controllers[0], recordID: s.id })),
      total: res.total,
    }
  }
}
