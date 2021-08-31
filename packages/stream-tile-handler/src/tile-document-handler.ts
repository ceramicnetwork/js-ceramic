import type CID from 'cids'
import jsonpatch from 'fast-json-patch'
import cloneDeep from 'lodash.clonedeep'

import { TileDocument } from '@ceramicnetwork/stream-tile'
import {
  AnchorCommit,
  AnchorStatus,
  CeramicCommit,
  CommitData,
  CommitMeta,
  CommitType,
  Context,
  SignatureStatus,
  StreamConstructor,
  StreamHandler,
  StreamState,
  StreamUtils,
} from '@ceramicnetwork/common'

const IPFS_GET_TIMEOUT = 60000 // 1 minute

/**
 * TileDocument stream handler implementation
 */
export class TileDocumentHandler implements StreamHandler<TileDocument> {
  get type(): number {
    return TileDocument.STREAM_TYPE_ID
  }

  get name(): string {
    return TileDocument.STREAM_TYPE_NAME
  }

  get stream_constructor(): StreamConstructor<TileDocument> {
    return TileDocument
  }

  /**
   * Applies commit (genesis|signed|anchor)
   * @param commit - Commit (with JWS envelope or anchor proof, if available and extracted before application)
   * @param meta - Commit meta-information
   * @param context - Ceramic context
   * @param state - Document state
   */
  async applyCommit(
    commit: CeramicCommit | CommitData,
    meta: CommitMeta,
    context: Context,
    state?: StreamState
  ): Promise<StreamState> {
    if (state == null) {
      // apply genesis
      return this._applyGenesis(commit, meta, context)
    }

    if ((commit as AnchorCommit).proof || (commit as CommitData).proof) {
      return this._applyAnchor(context, commit, meta.cid, state)
    }

    return this._applySigned(commit, meta, state, context)
  }

  /**
   * Applies genesis commit
   * @param commit - Genesis commit
   * @param meta - Genesis commit meta-information
   * @param context - Ceramic context
   * @private
   */
  async _applyGenesis(commit: any, meta: CommitMeta, context: Context): Promise<StreamState> {
    let payload = StreamUtils.isExpandedCommit(commit) ? commit.commit : commit
    const isSigned = StreamUtils.isSignedCommit(commit) || (commit as CommitData).envelope
    if (isSigned) {
      let envelope = commit
      if (StreamUtils.isExpandedCommit(commit)) {
        envelope = commit.envelope
      } else {
        payload = (await context.ipfs.dag.get(commit.link, { timeout: IPFS_GET_TIMEOUT })).value
      }
      await this._verifySignature(envelope, meta, context, payload.header.controllers[0])
    } else if (payload.data) {
      throw Error('Genesis commit with contents should always be signed')
    }

    if (!(payload.header.controllers && payload.header.controllers.length === 1)) {
      throw new Error('Exactly one controller must be specified')
    }

    return {
      type: TileDocument.STREAM_TYPE_ID,
      content: payload.data || {},
      metadata: payload.header,
      signature: isSigned ? SignatureStatus.SIGNED : SignatureStatus.GENESIS,
      anchorStatus: AnchorStatus.NOT_REQUESTED,
      log: [{ cid: meta.cid, type: CommitType.GENESIS }],
    }
  }

  /**
   * Applies signed commit
   * @param commit - Signed commit
   * @param meta - Commit meta-information
   * @param state - Document state
   * @param context - Ceramic context
   * @private
   */
  async _applySigned(
    commit: any,
    meta: CommitMeta,
    state: StreamState,
    context: Context
  ): Promise<StreamState> {
    // TODO: Assert that the 'prev' of the commit being applied is the end of the log in 'state'
    const controller = state.next?.metadata?.controllers?.[0] || state.metadata.controllers[0]

    // Verify the JWS before performing any additional IPFS lookups
    const envelope = StreamUtils.isExpandedCommit(commit) ? commit.envelope : commit
    await this._verifySignature(envelope, meta, context, controller)

    // Retrieve the payload
    const payload = StreamUtils.isExpandedCommit(commit)
      ? commit.commit
      : (await context.ipfs.dag.get(commit.link, { timeout: IPFS_GET_TIMEOUT })).value

    if (!payload.id.equals(state.log[0].cid)) {
      throw new Error(`Invalid streamId ${payload.id}, expected ${state.log[0].cid}`)
    }

    if (payload.header.controllers && payload.header.controllers.length !== 1) {
      throw new Error('Exactly one controller must be specified')
    }

    const nextState = cloneDeep(state)

    nextState.signature = SignatureStatus.SIGNED
    nextState.anchorStatus = AnchorStatus.NOT_REQUESTED

    nextState.log.push({ cid: meta.cid, type: CommitType.SIGNED })

    const content = state.next?.content ?? state.content
    const metadata = state.next?.metadata ?? state.metadata
    nextState.next = {
      content: jsonpatch.applyPatch(content, payload.data).newDocument,
      metadata: { ...metadata, ...payload.header },
    }
    return nextState
  }

  /**
   * Applies anchor commit
   * @param context - Ceramic context
   * @param commit - Anchor commit
   * @param cid - Anchor commit CID
   * @param state - Document state
   * @private
   */
  async _applyAnchor(
    context: Context,
    commit: any,
    cid: CID,
    state: StreamState
  ): Promise<StreamState> {
    // TODO: Assert that the 'prev' of the commit being applied is the end of the log in 'state'
    const proof = StreamUtils.isExpandedCommit(commit)
      ? commit.proof
      : (await context.ipfs.dag.get(commit.proof, { timeout: IPFS_GET_TIMEOUT })).value

    state.log.push({ cid, type: CommitType.ANCHOR, timestamp: proof.blockTimestamp })
    let content = state.content
    let metadata = state.metadata

    if (state.next?.content) {
      content = state.next.content
      delete state.next.content
    }

    if (state.next?.metadata) {
      metadata = state.next.metadata
      delete state.next.metadata
    }

    delete state.next
    delete state.anchorScheduledFor

    return {
      ...state,
      content,
      metadata,
      anchorStatus: AnchorStatus.ANCHORED,
      anchorProof: proof,
    }
  }

  /**
   * Verifies commit signature
   * @param commit - Commit to be verified
   * @param meta - Commit metadata
   * @param context - Ceramic context
   * @param did - DID value
   * @private
   */
  async _verifySignature(
    commit: any,
    meta: CommitMeta,
    context: Context,
    did: string
  ): Promise<void> {
    await context.did.verifyJWS(commit, {
      atTime: meta.timestamp,
      issuer: did,
      disableTimecheck: meta.disableTimecheck,
    })
  }
}
