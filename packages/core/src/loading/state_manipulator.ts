import { AppliableStreamLog, StreamState } from '@ceramicnetwork/common'

/**
 * Entirely stateless class for applying logs of Stream commits to StreamStates.  Handles all
 * conflict resolution rules. Does not do any i/o nor does it manage anything relating to caching or
 * persistence of the state information.
 */
export class StateManipulator {
  /**
   * Applies a complete Stream log (including a Genesis commit) in order to create a StreamState.
   * @param log
   */
  async applyFullLog(log: AppliableStreamLog): Promise<StreamState> {
    throw new Error(`Not yet implemented`)
  }

  /**
   * Applies a log of new commits to an existing StreamState to get the updated StreamState
   * resulting from applying the log. It's possible that the new StreamState could be the same as
   * the old one if the log is rejected due to conflict resolution.
   * @param state
   * @param log
   */
  async applyLogToState(state: StreamState, log: AppliableStreamLog): Promise<StreamState> {
    throw new Error(`Not yet implemented`)
  }
}
