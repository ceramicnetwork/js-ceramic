import type { StreamID } from '@ceramicnetwork/streamid'
import { CreateOpts, LoadOpts, UpdateOpts, CeramicCommit, Stream, AnchorOpts } from './index.js'
import type { IntoSigner } from './ceramic-signer.js'
import type { AnchorStatus } from './index.js'

export interface StreamWriter extends IntoSigner {
  /**
   * Create Stream from genesis commit
   * @param type - Stream type
   * @param genesis - Genesis commit
   * @param opts - Initialization options
   */
  createStreamFromGenesis<T extends Stream>(
    type: number,
    genesis: any,
    opts?: CreateOpts
  ): Promise<T>

  /**
   * Applies commit on the existing stream
   * @param streamId - Stream ID
   * @param commit - Commit to be applied
   * @param opts - Initialization options
   */
  applyCommit<T extends Stream>(
    streamId: StreamID | string,
    commit: CeramicCommit,
    opts?: UpdateOpts
  ): Promise<T>

  /**
   * Requests an anchor for the given StreamID if the Stream isn't already anchored.
   * Returns the new AnchorStatus for the Stream.
   * @param streamId
   * @param opts used to load the current Stream state
   */
  requestAnchor(streamId: StreamID | string, opts?: LoadOpts & AnchorOpts): Promise<AnchorStatus>
}
