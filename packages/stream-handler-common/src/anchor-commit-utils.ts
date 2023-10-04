import {
  AnchorStatus,
  CommitData,
  CommitType,
  StreamState,
  StreamUtils,
} from '@ceramicnetwork/common'
import cloneDeep from 'lodash.clonedeep'

/**
 * Mutates the input StreamState object to apply anchor timestamps to all commits that they anchor.
 * We do this for more than just the most recent anchor commit to fix-up the state objects
 * stored in the state store for streams that were created and pinned before this logic was in
 * place.  In the future, we may consider only propagating the timestamp from the anchor commit
 * being applied to the commits that it anchors, up until the previous anchor commit, and then
 * stopping, so we don't have to iterate over the whole log.
 */
function applyAnchorTimestampsToLog(state: StreamState): void {
  let timestamp
  for (let i = state.log.length - 1; i >= 0; i--) {
    const logEntry = state.log[i]
    if (logEntry.type == CommitType.ANCHOR) {
      timestamp = logEntry.timestamp
    } else {
      logEntry.timestamp = timestamp
    }
  }
}

export async function applyAnchorCommit(
  commitData: CommitData,
  state: Readonly<StreamState>
): Promise<StreamState> {
  StreamUtils.assertCommitLinksToState(state, commitData.commit)

  // If the anchor commit failed validation when the log was first fetched, we should throw that
  // error now as part of trying to apply it.
  if (commitData.anchorValidationError) {
    throw commitData.anchorValidationError
  }

  const newState:StreamState = cloneDeep(state) // don't modify the source object

  newState.anchorStatus = AnchorStatus.ANCHORED
  newState.anchorProof = commitData.proof
  newState.log.push({
    cid: commitData.cid,
    type: CommitType.ANCHOR,
    timestamp: commitData.timestamp,
  })

  applyAnchorTimestampsToLog(newState)

  if (newState.next?.content) {
    newState.content = newState.next.content
  }
  if (newState.next?.metadata) {
    newState.metadata = newState.next.metadata
  }
  delete newState.next

  return newState
}
