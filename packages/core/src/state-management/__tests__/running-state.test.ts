import CID from 'cids'
import { CommitType, StreamState } from '@ceramicnetwork/common'
import { RunningState, StateSource } from '../running-state'

const FAKE_CID1 = new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID2 = new CID('bafybeig6xv5nwphfmvcnektpnojts44jqcuam7bmye2pb54adnrtccjlsu')

const initial = {
  type: 0,
  log: [
    {
      type: CommitType.GENESIS,
      cid: FAKE_CID1,
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

test('emit on distinct changes', async () => {
  const state$ = new RunningState(initial, StateSource.STATESTORE)
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

test('set pinned state', async () => {
  const state$ = new RunningState(initial, StateSource.NETWORK)
  console.log(state$.pinnedCommits)
  expect(state$.pinnedCommits).toBe(undefined)
  expect(state$.stateSource).toBe(StateSource.NETWORK)

  state$.setPinnedState(second)
  expect(state$.pinnedCommits.size).toBe(2)
  expect(state$.stateSource).toBe(StateSource.STATESTORE)
  expect(state$.pinnedCommits.has(FAKE_CID1.toString())).toBe(true)
  expect(state$.pinnedCommits.has(FAKE_CID2.toString())).toBe(true)
})
