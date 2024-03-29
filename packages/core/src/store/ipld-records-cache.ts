import { LRUCache } from 'least-recent'
import { CodenameContainer } from 'cartonne'
import type { BlockCodec, CID } from 'multiformats'

export const IPFS_CACHE_HIT = 'ipfs_cache_hit'
export const IPFS_CACHE_MISS = 'ipfs_cache_miss'

/**
 * Fully decoded IPLD record and block bytes.
 */
type CacheEntry = {
  record: unknown
  block: Uint8Array
}

/**
 * LRU cache for IPLD records, both in decoded and encoded forms.
 */
export class IPLDRecordsCache {
  readonly codecs: CodenameContainer<BlockCodec<any, any>>
  private readonly cache: LRUCache<string, CacheEntry>

  /**
   * @param capacity - Maximum size of LRU cache.
   */
  constructor(capacity: number) {
    this.cache = new LRUCache(capacity)
    this.codecs = new CodenameContainer('codecs')
  }

  /**
   * Set an already decoded cache entry.
   */
  set(cid: CID, entry: CacheEntry) {
    this.cache.set(cid.toString(), entry)
  }

  /**
   * Set an entry, block bytes get encoded using codec of `cid`.
   */
  setRecord(cid: CID, record: unknown) {
    if (this.cache.has(cid.toString())) return
    const codec = this.codecs.get(cid.code)
    this.cache.set(cid.toString(), {
      record: record,
      block: codec.encode(record),
    })
  }

  /**
   * Set an entry, IPLD record gets decoded from block bytes using codec of `cid`.
   */
  setBlock(cid: CID, bytes: Uint8Array) {
    if (this.cache.has(cid.toString())) return
    const codec = this.codecs.get(cid.code)
    this.cache.set(cid.toString(), {
      record: codec.decode(bytes),
      block: bytes,
    })
  }

  /**
   * Return cached entry.
   */
  get(cid: CID): CacheEntry | undefined {
    return this.cache.get(cid.toString())
  }

  /**
   * IPFS allows you to get an IPLD record by a query like `CID/some/path`. We do not have resolution mechanism that would translate `cid/path` query into a CID,
   * so we just store an entry by query. See also `getUnresolved`.
   */
  setWithResolutionPath(query: string, entry: CacheEntry): void {
    this.cache.set(query, entry)
  }

  /**
   * IPFS allows you to get an IPLD record by a query like `CID/some/path`. We do not have resolution mechanism that would translate `cid/path` query into a CID,
   * so here we do our best to return an entry by query. See also `setUnresolved`.
   */
  getWithResolutionPath(query: string): CacheEntry | undefined {
    return this.cache.get(query)
  }
}
