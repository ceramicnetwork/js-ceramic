import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { Memoize } from 'mapmoize'

import { AnchorStatus, CommitData, EventType, Stream, StreamUtils } from '@ceramicnetwork/common'

import type { TileDocument } from '@ceramicnetwork/stream-tile'
import { Dispatcher } from './dispatcher.js'
import type { StreamID } from '@ceramicnetwork/streamid'
import { CID } from 'multiformats/cid'
import type { Cacao } from '@didtools/cacao'
import { Ceramic } from './ceramic.js'
import { InMemoryAnchorService } from './anchor/memory/in-memory-anchor-service.js'
import { filter, firstValueFrom } from 'rxjs'

/**
 * Various utility functions
 */
export class Utils {
  @Memoize()
  static get validator() {
    const ajv = new Ajv({ allErrors: true, strictTypes: false, strictTuples: false })
    addFormats(ajv)
    return ajv
  }

  /**
   * Validates model against JSON-Schema
   * @param content - Stream content
   * @param schema - Stream schema
   */
  static validate(content: any, schema: any): void {
    const isValid = Utils.validator.validate(schema, content)
    if (!isValid) {
      const errorMessages = Utils.validator.errorsText()
      throw new Error(`Validation Error: ${errorMessages}`)
    }
  }

  /**
   * Validate TileDocument against schema
   */
  static async validateSchema(doc: TileDocument): Promise<void> {
    const schemaStreamId = doc.state?.metadata?.schema
    if (schemaStreamId) {
      const schemaDoc = await doc.api.loadStream<TileDocument>(schemaStreamId)
      if (!schemaDoc) {
        throw new Error(`Schema not found for ${schemaStreamId}`)
      }
      Utils.validate(doc.content, schemaDoc.content)
    }
  }

  /**
   * Return `CommitData` (with commit, JWS envelope, and/or anchor proof/timestamp, as applicable) for the specified CID
   */
  static async getCommitData(
    dispatcher: Dispatcher,
    cid: CID,
    streamId: StreamID,
    timestamp?: number
  ): Promise<CommitData> {
    const commit = await dispatcher.retrieveCommit(cid, streamId)
    if (!commit) throw new Error(`No commit found for CID ${cid.toString()}`)
    // The default applies to all cases that do not use DagJWS for signing (e.g. CAIP-10 links)
    const commitData: CommitData = { cid, type: EventType.DATA, commit, timestamp }
    if (StreamUtils.isSignedCommit(commit)) {
      const linkedCommit = await dispatcher.retrieveCommit(commit.link, streamId)
      if (!linkedCommit) throw new Error(`No commit found for CID ${commit.link.toString()}`)
      commitData.commit = linkedCommit
      commitData.envelope = commit
      commitData.capability = await this.extractCapability(commit, dispatcher)
    } else if (StreamUtils.isAnchorCommit(commit)) {
      commitData.type = EventType.TIME
      commitData.proof = await dispatcher.retrieveFromIPFS(commit.proof)
    }
    if (!commitData.commit.prev) commitData.type = EventType.INIT
    return commitData
  }

  /**
   * Attempts to load CACAO capability from IPFS if present in protected header of commit
   * @param commit the commit to load the capability for
   * @param dispatcher instance of dispatcher to load from IPFS
   * @returns a Cacao capability object if found, else null
   */
  static async extractCapability(commit: any, dispatcher: Dispatcher): Promise<Cacao | undefined> {
    if (!commit.signatures || commit.signatures.length === 0) return

    const capCID = StreamUtils.getCacaoCidFromCommit(commit)

    if (!capCID) return

    try {
      const cacao = await dispatcher.retrieveFromIPFS(capCID)
      return cacao as Cacao
    } catch (error) {
      throw new Error(
        `Error while loading capability from IPFS with CID ${capCID.toString()}: ${error}`
      )
    }
  }

  /**
   * Trigger anchor for a stream.
   * @param ceramic Ceramic Core instance.
   * @param stream Stream to trigger anchor on.
   */
  static async anchorUpdate(ceramic: Ceramic, stream: Stream): Promise<void> {
    if ('anchor' in ceramic.anchorService) {
      const anchorService = ceramic.anchorService as InMemoryAnchorService
      const tillAnchored = firstValueFrom(
        stream.pipe(
          filter((state) =>
            [AnchorStatus.ANCHORED, AnchorStatus.FAILED].includes(state.anchorStatus)
          )
        )
      )
      await anchorService.anchor()
      await tillAnchored
    } else {
      return Promise.reject('Not InMemoryAnchorService')
    }
  }
}

export class TrieNode {
  public key: string
  public children: Record<string, TrieNode>

  constructor(key = '') {
    this.key = key
    this.children = {}
  }
}

export class PathTrie {
  public root: TrieNode

  constructor() {
    this.root = new TrieNode()
  }

  add(path: string) {
    const nextNodeAdd = (node: TrieNode, key: string): TrieNode => {
      if (!node.children[key]) node.children[key] = new TrieNode(key)
      return node.children[key]
    }
    if (path.startsWith('/')) path = path.substring(1)
    path.split('/').reduce(nextNodeAdd, this.root)
  }
}

export const promiseTimeout = (
  promise: Promise<any>,
  ms: number,
  timeoutErrorMsg: string
): Promise<any> => {
  const timeout = new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error(timeoutErrorMsg)), ms)
  })
  return Promise.race([timeout, promise])
}
