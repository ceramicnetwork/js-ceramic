
export function serializeState (state: any): any {
  state.log = state.log.map((cid: any) => cid.toString());
  if (state.anchorProof) {
    state.anchorProof.txHash = state.anchorProof.txHash.toString();
    state.anchorProof.root = state.anchorProof.root.toString();
  }
  return state
}

