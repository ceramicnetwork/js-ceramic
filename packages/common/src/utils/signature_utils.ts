import type { Cacao } from 'ceramic-cacao'
import type { DID } from 'dids'
import { CommitData } from '../index.js'
import { StreamID } from '@ceramicnetwork/streamid'

const DEFAULT_CACAO_REVOCATION_PHASE_OUT = 24 * 60 * 60

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
   * @param family - family of the stream being updated
   * @param streamId - Stream ID for the commit
   * @private
   */
  static async verifyCommitSignature(
    commitData: CommitData,
    did: DID,
    controller: string,
    family: string,
    streamId: StreamID
  ): Promise<void> {
    const cacao = await this._verifyCapabilityAuthz(commitData, streamId, family)

    const atTime = commitData.timestamp ? new Date(commitData.timestamp * 1000) : undefined
    await did.verifyJWS(commitData.envelope, {
      atTime: atTime,
      issuer: controller,
      disableTimecheck: commitData.disableTimecheck,
      capability: cacao,
      revocationPhaseOutSecs: DEFAULT_CACAO_REVOCATION_PHASE_OUT,
    })
  }

  /**
   * Verifies capability attached to a signed commit
   * @param commitData - Commit to be verified
   * @param streamId - Stream ID for the commit
   * @param family - family of the stream being updated
   * @returns Cacao is capability was found and verified, null otherwise
   */
  private static async _verifyCapabilityAuthz(
    commitData: CommitData,
    streamId: StreamID,
    family: string
  ): Promise<Cacao | null> {
    const cacao = commitData.capability

    if (!cacao) return null

    const resources = cacao.p.resources as string[]
    const payloadCID = commitData.envelope.link.toString()

    if (
      !resources.includes(`ceramic://*`) &&
      !resources.includes(`ceramic://${streamId.toString()}`) &&
      !resources.includes(`ceramic://${streamId.toString()}?payload=${payloadCID}`) &&
      !(family && resources.includes(`ceramic://*?family=${family}`))
    ) {
      throw new Error(`Capability does not have appropriate permissions to update this Model`)
    }

    return cacao
  }
}
