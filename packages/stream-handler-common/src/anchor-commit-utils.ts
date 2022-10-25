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

  // Apply anchor timestamp to all commits that it anchors
  for (let i = state.log.length - 1; i >= 0; i--) {
    const logEntry = state.log[i]
    if (logEntry.timestamp || logEntry.type == CommitType.ANCHOR) {
      break
    }
    logEntry.timestamp = commitData.proof.blockTimestamp
  }

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
