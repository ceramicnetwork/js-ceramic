import type { CommitID, StreamID } from '@ceramicnetwork/streamid'
import type { CIDHolder } from './cid-holder.type.js'
import type { CID } from 'multiformats/cid'

export interface ICandidateMetadata {
  controllers: Array<string>
  schema?: CommitID
  family?: string
  tags?: Array<string>
  model?: StreamID
}

export interface ICandidate extends CIDHolder {
  readonly cid: CID
  readonly streamId: StreamID
  readonly metadata: ICandidateMetadata
}
