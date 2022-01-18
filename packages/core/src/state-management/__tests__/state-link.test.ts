import { CID } from 'multiformats/cid'
import { CommitType, StreamState } from '@ceramicnetwork/common'
import { StateLink } from '../state-link.js'
import { Observable } from 'rxjs'

const FAKE_CID_1 = CID.parse('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID2 = CID.parse('bafybeig6xv5nwphfmvcnektpnojts44jqcuam7bmye2pb54adnrtccjlsu')

test('emit on distinct changes', async () => {
  const initial = {
    type: 0,
    log: [
      {
        type: CommitType.GENESIS,
        cid: FAKE_CID_1,
      },
    ],
  } as unknown as StreamState
  const second = {
    ...initial,
    log: [
      ...initial.log,
      {
        type: CommitType.SIGNED,
        cid: FAKE_CID2,
      },
    ],
  } as unknown as StreamState

  const feed$ = new Observable<StreamState>()
  const state$ = new StateLink(initial, () => feed$)
  const updates: StreamState[] = []
  state$.subscribe((state) => {
    updates.push(state)
  })
  expect(updates.length).toEqual(1)
  expect(updates[0]).toBe(initial)

  state$.next(initial)
  // No change
  expect(updates.length).toEqual(1)
  expect(updates[0]).toBe(initial)

  state$.next(initial)
  // Still no change
  expect(updates.length).toEqual(1)
  expect(updates[0]).toBe(initial)

  state$.next(second)
  // Push second state
  expect(updates.length).toEqual(2)
  expect(updates[0]).toBe(initial)
  expect(updates[1]).toBe(second)

  state$.next(second)
  // No change
  expect(updates.length).toEqual(2)
  expect(updates[0]).toBe(initial)
  expect(updates[1]).toBe(second)
})
