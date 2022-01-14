import { CID } from 'multiformats/cid'
import { CommitType, StreamState } from '@ceramicnetwork/common'
import { Document } from '../document.js'
import { BehaviorSubject } from 'rxjs'
import { filter, first } from 'rxjs/operators'

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

  const state$ = new Document(initial, '', 1000)
  // Disable background polling to avoid getting an error from node-fetch since there's no
  // daemon listening to receive the requests.
  state$._syncState = async function () {
    /* do nothing*/
  }
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

  state$.complete()
})

describe('periodic subscription', () => {
  function pairs(input: number[]): number[] {
    return input.reduce(function (result, value, index, array) {
      if (index % 2 === 0) result.push(array.slice(index, index + 2))
      return result
    }, [])
  }

  const SYNC_INTERVAL = 200
  const SAMPLES_AMOUNT = 6

  test('call _syncState periodically when subscribed', async () => {
    const initial = {
      type: 0,
      log: [
        {
          type: CommitType.GENESIS,
          cid: FAKE_CID_1,
        },
      ],
    } as unknown as StreamState
    const document = new Document(initial, '', SYNC_INTERVAL)
    // Every Document#_syncState we commit when it was called.
    // Also we track how many invocations happened to stop after enough samples are acquired.
    const invocations = []
    const calledTimes = new BehaviorSubject<number>(0)
    document._syncState = async () => {
      calledTimes.next(calledTimes.value + 1)
      invocations.push(new Date().valueOf())
    }
    const subscription = document.subscribe()
    // Wait for few samples
    await calledTimes
      .pipe(
        filter((n) => n >= SAMPLES_AMOUNT),
        first()
      )
      .toPromise()
    subscription.unsubscribe()

    // Invocations should happen every SYNC_INTERVAL (with some error bounded to 80% of SYNC_INTERVAL)
    const deltas = pairs(invocations).map((pair) => pair[1] - pair[0])
    deltas.forEach((delta) => {
      expect(Math.abs(delta - SYNC_INTERVAL)).toBeLessThan(SYNC_INTERVAL * 0.8)
    })
  })
  test('call _syncState periodically when subscribed multiple times', async () => {
    // AKA Make sure there is only one stream of periodic _syncState calls
    const initial = {
      type: 0,
      log: [
        {
          type: CommitType.GENESIS,
          cid: FAKE_CID_1,
        },
      ],
    } as unknown as StreamState
    const document = new Document(initial, '', SYNC_INTERVAL)
    // Every Document#_syncState we commit when it was called.
    // Also we track how many invocations happened to stop after enough samples are acquired.
    const invocations = []
    const calledTimes = new BehaviorSubject<number>(0)
    document._syncState = async () => {
      calledTimes.next(calledTimes.value + 1)
      invocations.push(new Date().valueOf())
    }
    const subscription1 = document.subscribe()
    const subscription2 = document.subscribe()
    // Wait for few samples
    await calledTimes
      .pipe(
        filter((n) => n >= SAMPLES_AMOUNT),
        first()
      )
      .toPromise()
    subscription1.unsubscribe()
    subscription2.unsubscribe()

    // Invocations should happen every SYNC_INTERVAL (with some error bounded to 80% of SYNC_INTERVAL)
    // If more than one stream of _syncState calls exists, some consecutive calls would happen within 1-2ms
    const deltas = pairs(invocations).map((pair) => pair[1] - pair[0])
    deltas.forEach((delta) => {
      expect(Math.abs(delta - SYNC_INTERVAL)).toBeLessThan(SYNC_INTERVAL * 0.8)
    })
  })
})
