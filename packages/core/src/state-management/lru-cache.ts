/**
 * Applies a maximum size to a Map by evicting the eldest entry when the maximum size is exceeded. Also allows eviction
 * handling to optionally be specified for when the eldest entry is evicted.
 */
export class LruCache<K, V> {

    private readonly maxSize: number
    private readonly map: Map<K, V>

    /**
     * Called when the eldest entry is evicted from the cache.
     */
    private readonly evictionHandler: (key: K, value: V) => any

    constructor(maxSize: number, evictionHandler?: (key: K, value: V) => any) {
        if (maxSize <= 0) throw new Error('Cache size must be a positive number')
        this.maxSize = maxSize
        this.evictionHandler = evictionHandler;
        this.map = new Map()
    }

    /**
     * Evicts the earliest inserted entry (also called the eldest entry) if the addition of the specified key-value pair
     * will cause the size of the cache to increase beyond the specified maximum.
     */
    public async set(key: K, value: V): Promise<this> {
        if (this.map.size === this.maxSize) {
            let eldest = this.map.entries().next().value
            this.map.delete(eldest[0])
            await this.evictionHandler?.(eldest[0], eldest[1]);
        }
        this.map.set(key, value)
        return this
    }

    /**
     * Returns the cached value for a given key, if available.
     *
     * @param key   ID of record to retrieve
     */
    public async get(key: K): Promise<V> {
        return this.map.get(key)
    }
}