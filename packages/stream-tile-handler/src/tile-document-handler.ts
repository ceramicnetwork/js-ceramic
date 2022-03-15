import jsonpatch from 'fast-json-patch'
import cloneDeep from 'lodash.clonedeep'
import type { Cacao } from 'ceramic-cacao'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import {
  AnchorStatus,
  CommitData,
  CommitType,
  Context,
  SignatureStatus,
  StreamConstructor,
  StreamHandler,
  StreamState,
  StreamUtils,
} from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import { base64urlToJSON } from './utils.js'
import { CID } from 'multiformats/cid'

const DEFAULT_REVOCATION_PHASE_OUT = 24 * 60 * 60

function stringArraysEqual(arr1: Array<string>, arr2: Array<string>) {
  if (arr1.length != arr2.length) {
    return false
  }
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false
    }
  }
  return true
}

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
   * @param commitData - Commit (with JWS envelope or anchor proof, if available and extracted before application)
   * @param context - Ceramic context
   * @param state - Document state
   */
  async applyCommit(
    commitData: CommitData,
    context: Context,
    state?: StreamState
  ): Promise<StreamState> {
    if (state == null) {
      // apply genesis
      return this._applyGenesis(commitData, context)
    }

    if (StreamUtils.isAnchorCommitData(commitData)) {
      return this._applyAnchor(context, commitData, state)
    }

    return this._applySigned(commitData, state, context)
  }

  /**
   * Applies genesis commit
   * @param commitData - Genesis commit
   * @param context - Ceramic context
   * @private
   */
  async _applyGenesis(commitData: CommitData, context: Context): Promise<StreamState> {
    const payload = commitData.commit
    const isSigned = StreamUtils.isSignedCommitData(commitData)
    if (isSigned) {
      const streamId = await StreamID.fromGenesis('tile', commitData.commit)
      const { controllers, family } = payload.header
      await this._verifySignature(commitData, context, controllers[0], family, streamId)
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
      log: [{ cid: commitData.cid, type: CommitType.GENESIS }],
    }
  }

  /**
   * Applies signed commit
   * @param commitData - Signed commit
   * @param state - Document state
   * @param context - Ceramic context
   * @private
   */
  async _applySigned(
    commitData: CommitData,
    state: StreamState,
    context: Context
  ): Promise<StreamState> {
    // TODO: Assert that the 'prev' of the commit being applied is the end of the log in 'state'
    const controller = state.next?.metadata?.controllers?.[0] || state.metadata.controllers[0]
    const family = state.next?.metadata?.family || state.metadata.family

    // Verify the signature first
    const streamId = StreamUtils.streamIdFromState(state)
    await this._verifySignature(commitData, context, controller, family, streamId)

    // Retrieve the payload
    const payload = commitData.commit

    if (!payload.id.equals(state.log[0].cid)) {
      throw new Error(`Invalid streamId ${payload.id}, expected ${state.log[0].cid}`)
    }

    if (payload.header.controllers && payload.header.controllers.length !== 1) {
      throw new Error('Exactly one controller must be specified')
    }

    if (
      state.metadata.forbidControllerChange &&
      payload.header.controllers &&
      !stringArraysEqual(payload.header.controllers, state.metadata.controllers)
    ) {
      const streamId = new StreamID(TileDocument.STREAM_TYPE_ID, state.log[0].cid)
      throw new Error(
        `Cannot change controllers since 'forbidControllerChange' is set. Tried to change controllers for Stream ${streamId} from ${JSON.stringify(
          state.metadata.controllers
        )} to ${payload.header.controllers}`
      )
    }

    if (
      payload.header.forbidControllerChange !== undefined &&
      payload.header.forbidControllerChange !== state.metadata.forbidControllerChange
    ) {
      throw new Error("Changing 'forbidControllerChange' metadata property is not allowed")
    }

    const nextState = cloneDeep(state)

    nextState.signature = SignatureStatus.SIGNED
    nextState.anchorStatus = AnchorStatus.NOT_REQUESTED

    nextState.log.push({ cid: commitData.cid, type: CommitType.SIGNED })

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
   * @param commitData - Anchor commit
   * @param state - Document state
   * @private
   */
  async _applyAnchor(
    context: Context,
    commitData: CommitData,
    state: StreamState
  ): Promise<StreamState> {
    // TODO: Assert that the 'prev' of the commit being applied is the end of the log in 'state'
    const proof = commitData.proof
    state.log.push({
      cid: commitData.cid,
      type: CommitType.ANCHOR,
      timestamp: proof.blockTimestamp,
    })
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
   * Verifies commit signature. If a revoked key is used to create the signature, the signature is valid for 24h after the revocation
   * @param commitData - Commit to be verified
   * @param context - Ceramic context
   * @param controller - DID value
   * @param streamId - Stream ID for the commit
   * @private
   */
  async _verifySignature(
    commitData: CommitData,
    context: Context,
    controller: string,
    family: string,
    streamId: StreamID
  ): Promise<void> {
    const cacao = await this._verifyCapabilityAuthz(commitData, context, streamId, family)

    await context.did.verifyJWS(commitData.envelope, {
      atTime: commitData.timestamp,
      issuer: controller,
      disableTimecheck: commitData.disableTimecheck,
      capability: cacao,
      // TODO: rename to revocationPhaseOutSecs
      revocationPhaseOut: DEFAULT_REVOCATION_PHASE_OUT,
    })
  }

  /**
   * Verifies capability attached to a signed commit
   * @param commitData - Commit to be verified
   * @param context - Ceramic context
   * @param streamId - Stream ID for the commit
   * @returns Cacao is capability was found and verified, null otherwise
   */
  async _verifyCapabilityAuthz(
    commitData: CommitData,
    context: Context,
    streamId: StreamID,
    family: string
  ): Promise<Cacao | null> {
    const protectedHeader = commitData.envelope.signatures[0].protected
    const decodedProtectedHeader = base64urlToJSON(protectedHeader)

    if (!decodedProtectedHeader.cap) return null

    const capIPFSUri = decodedProtectedHeader.cap
    const capCID = CID.parse(capIPFSUri.replace('ipfs://', ''))
    const cacao = (await context.ipfs.dag.get(capCID)).value as Cacao
    const resources = cacao.p.resources as string[]
    const payloadCID = commitData.envelope.link.toString()

    if (resources.includes(`ceramic://*`)) {
      throw new Error(`Capability resource is not allowed`)
    }

    if (
      !resources.includes(`ceramic://${streamId.toString()}`) &&
      !resources.includes(`ceramic://${streamId.toString()}?payload=${payloadCID}`) &&
      !(family && resources.includes(`ceramic://*?family=${family}`))
    ) {
      throw new Error(
        `Capability does not have appropriate permissions to update this TileDocument`
      )
    }

    return cacao
  }
}
