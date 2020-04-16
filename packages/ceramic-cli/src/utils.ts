
export function serializeState (state: any): any {
  state.log = state.log.map((cid: any) => cid.toString())
  return state
}

