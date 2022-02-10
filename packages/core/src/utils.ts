import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { Memoize } from 'typescript-memoize'

import { CommitData, CommitType, IpfsApi, StreamUtils } from '@ceramicnetwork/common'

import type { TileDocument } from '@ceramicnetwork/stream-tile'
import { Dispatcher } from './dispatcher.js'
import type { StreamID } from '@ceramicnetwork/streamid'
import { CID } from 'multiformats/cid'
import { fromString, toString } from 'uint8arrays'

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
   * Awaits on condition for certain amount of time
   */
  // eslint-disable-next-line @typescript-eslint/ban-types
  static async awaitCondition(
    conditionFn: Function,
    stopFunction: Function,
    awaitInterval: number
  ): Promise<void> {
    while (conditionFn()) {
      if (stopFunction()) {
        return
      }
      await new Promise((resolve) => setTimeout(resolve, awaitInterval))
    }
  }

  /**
   * Validates model against JSON-Schema
   * @param schema - Stream schema
   */
  static isSchemaValid(schema: Record<string, unknown>): boolean {
    Utils.validator.compile(schema) // throws an error on invalid schema
    return Utils.validator.validateSchema(schema) as boolean // call validate schema just in case
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
    timestamp?: number,
    streamId?: StreamID
  ): Promise<CommitData> {
    const commit = await dispatcher.retrieveCommit(cid, streamId)
    if (!commit) throw new Error(`No commit found for CID ${cid.toString()}`)
    // The default applies to all cases that do not use DagJWS for signing (e.g. CAIP-10 links)
    const commitData: CommitData = { cid, type: CommitType.SIGNED, commit, timestamp }
    if (StreamUtils.isSignedCommit(commit)) {
      const linkedCommit = await dispatcher.retrieveCommit(commit.link, streamId)
      if (!linkedCommit) throw new Error(`No commit found for CID ${commit.link.toString()}`)
      commitData.commit = linkedCommit
      commitData.envelope = commit
    } else if (StreamUtils.isAnchorCommit(commit)) {
      commitData.type = CommitType.ANCHOR
      commitData.proof = await dispatcher.retrieveFromIPFS(commit.proof)
      commitData.timestamp = commitData.proof.blockTimestamp
    }
    if (!commitData.commit.prev) commitData.type = CommitType.GENESIS
    return commitData
  }

  /**
   * Puts a block on IPFS
   * @param cid the CID of the block to put
   * @param block bytes array of block to put
   * @param ipfsApi the IPFS Api instance to use
   */
  static async putIPFSBlock(cid: CID | string, block: Uint8Array, ipfsApi: IpfsApi) {
    if (typeof cid === 'string') cid = CID.parse(cid.replace('ipfs://', ''))
    const format = await ipfsApi.codecs.getCodec(cid.code).then((f) => f.name)
    const mhtype = await ipfsApi.hashers.getHasher(cid.multihash.code).then((mh) => mh.name)
    const version = cid.version
    await ipfsApi.block.put(block, { format, mhtype, version })
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

export function base64urlToJSON(s: string): Record<string, any> {
  return JSON.parse(toString(fromString(s, 'base64url'))) as Record<string, any>
}
