import type { Cacao } from '@didtools/cacao'
import type { CommitData, StreamState } from '../stream.js'
import type { StreamID } from '@ceramicnetwork/streamid'
import { getEIP191Verifier } from '@didtools/pkh-ethereum'
import { getSolanaVerifier } from '@didtools/pkh-solana'
import { getStacksVerifier } from '@didtools/pkh-stacks'
import { getTezosVerifier } from '@didtools/pkh-tezos'
import { CeramicSigner } from '../ceramic-signer.js'
import { StreamUtils } from './stream-utils.js'
import { ServiceMetrics as Metrics } from '@ceramicnetwork/observability'

const DEFAULT_CACAO_REVOCATION_PHASE_OUT_SECS = 24 * 60 * 60

// Metric for when we try to apply a new commit and the CACAO for that commit is expired.
export const CACAO_EXPIRED_NEW_COMMIT = 'cacao_expired_new_commit'

// Metric for when we try to load or update a stored StreamState and observe that a commit within
// the log has had its CACAO expire since we first built and stored that state.
export const CACAO_EXPIRED_EXISTING_STATE = 'cacao_expired_existing_state'

// Register supported CACAO Verifiers
const verifiersCACAO = {
  ...getEIP191Verifier(),
  ...getSolanaVerifier(),
  ...getStacksVerifier(),
  ...getTezosVerifier(),
}

/**
 * Utils related to cryptographic signatures
 */
export class SignatureUtils {
  /**
   * Verifies commit signature. If a revoked key is used to create the signature, the signature is valid for 24h after the revocation. This is so that if an update made before the key revocation winds up getting anchored after the revocation does, we don't fail the write unnecessarily.
   * TODO: Remove or significantly shorten this grace period once anchors happen far more frequently on the network.
   * @param commitData - Commit to be verified
   * @param signer - Signer for verification
   * @param controller - Stream controller DID value
   * @param model - model of the stream being updated
   * @param streamId - Stream ID for the commit
   * @private
   */
  static async verifyCommitSignature(
    commitData: CommitData,
    signer: CeramicSigner,
    controller: string,
    model: StreamID | null,
    streamId: StreamID
  ): Promise<void> {
    try {
      const cacao = await this._verifyCapabilityAuthz(commitData, streamId, model)

      const atTime = commitData.timestamp ? new Date(commitData.timestamp * 1000) : undefined
      await signer.verifyJWS(commitData.envelope, {
        atTime: atTime,
        issuer: controller,
        capability: cacao,
        revocationPhaseOutSecs: DEFAULT_CACAO_REVOCATION_PHASE_OUT_SECS,
        verifiers: verifiersCACAO,
      })
    } catch (e: any) {
      const original = e.message ? e.message : String(e)
      if (original.includes('CACAO has expired')) {
        // TODO: string matching error messages is brittle. Can we use a stable error code instead?
        Metrics.count(CACAO_EXPIRED_NEW_COMMIT, 1)
      }
      throw new Error(
        `Can not verify signature for commit ${commitData.cid} to stream ${streamId} which has controller DID ${controller}: ${original}`
      )
    }
  }

  /**
   * Verifies capability attached to a signed commit
   * @param commitData - Commit to be verified
   * @param streamId - Stream ID for the commit
   * @param model - model of the stream being updated
   * @returns Cacao is capability was found and verified, null otherwise
   */
  private static async _verifyCapabilityAuthz(
    commitData: CommitData,
    streamId: StreamID,
    model: StreamID | null
  ): Promise<Cacao | null> {
    const cacao = commitData.capability

    if (!cacao) return null

    const resources = cacao.p.resources as string[]
    const payloadCID = commitData.envelope.link.toString()

    if (
      !resources.includes(`ceramic://*`) &&
      !resources.includes(`ceramic://${streamId.toString()}`) &&
      !resources.includes(`ceramic://${streamId.toString()}?payload=${payloadCID}`) &&
      !(model && resources.includes(`ceramic://*?model=${model.toString()}`))
    ) {
      throw new Error(`Capability does not have appropriate permissions to update this Stream`)
    }

    return cacao
  }

  /**
   * Takes a StreamState and validates that none of the commits in its log are based on expired CACAOs.
   */
  static checkForCacaoExpiration(state: StreamState): void {
    const now = Math.floor(Date.now() / 1000) // convert millis to seconds
    for (const logEntry of state.log) {
      const timestamp = logEntry.timestamp ?? now
      if (!logEntry.expirationTime) {
        continue
      }
      const expirationTime = logEntry.expirationTime + DEFAULT_CACAO_REVOCATION_PHASE_OUT_SECS
      if (expirationTime < timestamp) {
        Metrics.count(CACAO_EXPIRED_EXISTING_STATE, 1)
        throw new Error(
          `CACAO expired: Commit ${logEntry.cid.toString()} of Stream ${StreamUtils.streamIdFromState(
            state
          ).toString()} has a CACAO that expired at ${
            logEntry.expirationTime
          }. Loading the stream with 'sync: SyncOptions.ALWAYS_SYNC' will restore the stream to a usable state, by discarding the invalid commits (this means losing the data from those invalid writes!)`
        )
      }
    }
  }
}
