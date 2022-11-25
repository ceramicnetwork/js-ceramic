import { validateLink } from '@ceramicnetwork/blockchain-utils-validation'
import { Caip10Link } from '@ceramicnetwork/stream-caip10-link'
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
  toLegacyAccountId,
} from '@ceramicnetwork/common'
import { applyAnchorCommit } from '@ceramicnetwork/stream-handler-common'

export class Caip10LinkHandler implements StreamHandler<Caip10Link> {
  get type(): number {
    return Caip10Link.STREAM_TYPE_ID
  }

  get name(): string {
    return Caip10Link.STREAM_TYPE_NAME
  }

  get stream_constructor(): StreamConstructor<Caip10Link> {
    return Caip10Link
  }

  /**
   * Applies commit (genesis|signed|anchor)
   * @param commitData - Commit (with JWS envelope or anchor proof, if available and extracted before application)
   * @param context - Ceramic context
   * @param state - Stream state
   */
  async applyCommit(
    commitData: CommitData,
    context: Context,
    state?: StreamState
  ): Promise<StreamState> {
    if (state == null) {
      return this._applyGenesis(commitData)
    }

    if (StreamUtils.isAnchorCommitData(commitData)) {
      return this._applyAnchor(commitData, state)
    }

    return this._applySigned(commitData, state)
  }

  /**
   * Applies genesis commit
   * @param commitData - Genesis commit
   * @private
   */
  async _applyGenesis(commitData: CommitData): Promise<StreamState> {
    const commit = commitData.commit
    if (commit.data) {
      throw new Error('Caip10Link genesis commit cannot have data')
    }

    const metadata = commit.header
    if (!(metadata.controllers && metadata.controllers.length === 1)) {
      throw new Error('Exactly one controller must be specified')
    }

    // TODO - verify genesis commit
    const state: StreamState = {
      type: Caip10Link.STREAM_TYPE_ID,
      content: null,
      next: {
        content: null,
      },
      metadata,
      signature: SignatureStatus.GENESIS,
      anchorStatus: AnchorStatus.NOT_REQUESTED,
      log: [{ cid: commitData.cid, type: CommitType.GENESIS }],
    }

    return state
  }

  /**
   * Applies signed commit
   * @param commitData - Signed commit
   * @param state - Stream state
   * @private
   */
  async _applySigned(commitData: CommitData, state: StreamState): Promise<StreamState> {
    const commit = commitData.commit
    StreamUtils.assertCommitLinksToState(state, commit)

    let validProof = null
    try {
      validProof = await validateLink(commit.data)
    } catch (e) {
      throw new Error(
        'Error while validating link proof for caip10-link signed commit: ' + e.toString()
      )
    }
    if (!validProof) {
      throw new Error('Invalid proof for signed commit')
    }

    if (
      state.signature !== SignatureStatus.GENESIS &&
      ((state.anchorStatus === AnchorStatus.ANCHORED &&
        validProof.timestamp < state.anchorProof.blockTimestamp) ||
        (state.anchorStatus !== AnchorStatus.ANCHORED &&
          validProof.timestamp < state.next.metadata.lastUpdate))
    ) {
      throw new Error('Invalid commit, proof timestamp too old')
    }

    // TODO: handle CAIP-10 addresses in proof generation of 3id-blockchain-utils
    const account: string = validProof.account || validProof.address

    const legacyAccountCaip10 = toLegacyAccountId(account)

    // We can assume that controllers will always follow the legacy CAIP-10 Link format
    const legacyControllerCaip10 = state.metadata.controllers[0]
    if (!legacyControllerCaip10.includes('@')) {
      throw new Error('Controller is not following the legacy CAIP10 format. Unexpected error.')
    }

    if (legacyAccountCaip10.toLowerCase() !== legacyControllerCaip10.toLowerCase()) {
      throw new Error(
        `Address '${legacyAccountCaip10.toLowerCase()}' used to sign update to Caip10Link doesn't match stream controller '${legacyControllerCaip10.toLowerCase()}'`
      )
    }
    state.log.push({ cid: commitData.cid, type: CommitType.SIGNED })
    return {
      ...state,
      signature: SignatureStatus.SIGNED,
      anchorStatus: AnchorStatus.NOT_REQUESTED,
      next: {
        content: validProof.did,
        metadata: {
          ...state.metadata,
          lastUpdate: validProof.timestamp, // in case there are two updates after each other
        },
      },
    }
  }

  /**
   * Applies anchor commit
   * @param commitData - Anchor commit
   * @param state - Stream state
   * @private
   */
  async _applyAnchor(commitData: CommitData, state: StreamState): Promise<StreamState> {
    return applyAnchorCommit(commitData, state)
  }
}
