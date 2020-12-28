import { LRUMap } from 'lru_map'
import DocID from "@ceramicnetwork/docid"

import Document from "./document"

/**
 * Encapsulates document caching (base, commits)
 */
class DocumentCache {
    private readonly _cacheCommits: boolean
    private readonly _baseCache: LRUMap<string, Document>
    private readonly _commitCache: LRUMap<string, Document>

    constructor(limit, cacheCommits = true) {
        this._cacheCommits = cacheCommits
        this._baseCache = new LRUMap(limit)
        this._commitCache = new LRUMap(limit)
    }

    /**
     * Set document to cache
     * @param doc - Document instance
     */
    set(doc: Document): void {
        this._baseCache.set(doc.id.baseID.toString(), doc)
        if (this._cacheCommits && doc.id.commit) {
            this._commitCache.set(doc.id.toString(), doc)
        }
    }

    /**
     * Get document from cache
     * @param docId - Document ID
     */
    get(docId: DocID): Document {
        const doc = this._baseCache.get(docId.toString())
        if (doc) {
            return doc
        }
        return this._cacheCommits? this._commitCache.get(docId.toString()): null
    }
}

export default DocumentCache
