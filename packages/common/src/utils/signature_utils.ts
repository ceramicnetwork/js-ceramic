import type { Cacao } from '@didtools/cacao'
import type { DID } from 'dids'
import type { CommitData } from '../index.js'
import type { StreamID } from '@ceramicnetwork/streamid'
import { getEIP191Verifier } from '@didtools/pkh-ethereum'
import { getSolanaVerifier } from '@didtools/pkh-solana'

const DEFAULT_CACAO_REVOCATION_PHASE_OUT = 24 * 60 * 60


// Register supported CACAO Verifiers
const verifiersCACAO = {
  ...getEIP191Verifier(),
  ...getSolanaVerifier()
}

/**
 * Utils related to cryptographic signatures
 */
export class SignatureUtils {
  /**
   * Verifies commit signature. If a revoked key is used to create the signature, the signature is valid for 24h after the revocation. This is so that if an update made before the key revocation winds up getting anchored after the revocation does, we don't fail the write unnecessarily.
   * TODO: Remove or significantly shorten this grace period once anchors happen far more frequently on the network.
   * @param commitData - Commit to be verified
   * @param did - DID instance
   * @param controller - Stream controller DID value
   * @param model - model of the stream being updated
   * @param streamId - Stream ID for the commit
   * @private
   */
  static async verifyCommitSignature(
    commitData: CommitData,
    did: DID,
    controller: string,
    model: StreamID | null,
    streamId: StreamID
  ): Promise<void> {
    try {
      const cacao = await this._verifyCapabilityAuthz(commitData, streamId, model)

      const atTime = commitData.timestamp ? new Date(commitData.timestamp * 1000) : undefined
      await did.verifyJWS(commitData.envelope, {
        atTime: atTime,
        issuer: controller,
        disableTimecheck: commitData.disableTimecheck,
        capability: cacao,
        revocationPhaseOutSecs: DEFAULT_CACAO_REVOCATION_PHASE_OUT,
        verifiers: verifiersCACAO
      })
    } catch (e: any) {
      const original = e.message ? e.message : String(e)
      throw new Error(`Can not verify signature for commit ${commitData.cid}: ${original}`)
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
}
