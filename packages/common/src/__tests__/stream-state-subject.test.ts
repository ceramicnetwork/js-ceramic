import { CID } from 'multiformats/cid'
import { StreamStateSubject } from '../stream-state-subject.js'
import { EventType, StreamState } from '../stream.js'

const FAKE_CID_1 = CID.parse('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID2 = CID.parse('bafybeig6xv5nwphfmvcnektpnojts44jqcuam7bmye2pb54adnrtccjlsu')

test('emit on distinct changes', async () => {
  const initial = {
    type: 0,
    log: [
      {
        type: EventType.INIT,
        cid: FAKE_CID_1,
      },
    ],
  } as unknown as StreamState
  const second = {
    ...initial,
    log: [
      ...initial.log,
      {
        type: EventType.DATA,
        cid: FAKE_CID2,
      },
    ],
  } as unknown as StreamState

  const state$ = new StreamStateSubject(initial)
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
