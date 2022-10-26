import {
  AnchorStatus,
  CommitData,
  CommitType,
  StreamState,
  StreamUtils,
} from '@ceramicnetwork/common'
import cloneDeep from 'lodash.clonedeep'

export async function applyAnchorCommit(
  commitData: CommitData,
  state: StreamState
): Promise<StreamState> {
  StreamUtils.assertCommitLinksToState(state, commitData.commit)
  state = cloneDeep(state) // don't modify the source object

  state.anchorStatus = AnchorStatus.ANCHORED
  state.anchorProof = commitData.proof
  state.log.push({
    cid: commitData.cid,
    type: CommitType.ANCHOR,
    timestamp: commitData.proof.blockTimestamp,
  })

  if (state.next?.content) {
    state.content = state.next.content
  }
  if (state.next?.metadata) {
    state.metadata = state.next.metadata
  }
  delete state.next

  return state
}
