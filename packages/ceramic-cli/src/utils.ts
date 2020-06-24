import { AnchorStatus } from "@ceramicnetwork/ceramic-common/lib/doctype"

export function serializeState (state: any): any {
  state.log = state.log.map((cid: any) => cid.toString());
  if (state.anchorStatus) {
    state.anchorStatus = AnchorStatus[state.anchorStatus];
  }
  if (state.anchorScheduledFor) {
    state.anchorScheduledFor = new Date(state.anchorScheduledFor).toISOString(); // ISO format of the UTC time
  }
  if (state.anchorProof) {
    state.anchorProof.txHash = state.anchorProof.txHash.toString();
    state.anchorProof.root = state.anchorProof.root.toString();
  }
  return state
}

