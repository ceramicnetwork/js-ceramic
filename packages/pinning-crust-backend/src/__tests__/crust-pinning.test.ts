import { CrustPinningBackend, EmptySeedError } from '../index'
import CID from 'cids'

const seed = 'test seed test seed test seed test seed test seed test seed'
const connectionString = `crust://test.network?seed=${seed}`

describe('constructor', () => {
  test('set crust endpoint from crust:// URL', () => {
    const pinning = new CrustPinningBackend(connectionString)
    expect(pinning.endpoint).toEqual('ws://test.network')
    expect(pinning.seed).toEqual(seed)
  })
  test('set crust endpoint from crust+ws:// URL', () => {
    const pinning = new CrustPinningBackend(`crust+ws://192.168.22.22:9944?seed=${seed}`)
    expect(pinning.endpoint).toEqual('ws://192.168.22.22:9944')
    expect(pinning.seed).toEqual(seed)
  })
  test('set crust endpoint from crust+wss:// URL', () => {
    const pinning = new CrustPinningBackend(`crust+wss://test.network?seed=${seed}`)
    expect(pinning.endpoint).toEqual('wss://test.network')
    expect(pinning.seed).toEqual(seed)
  })
  test('require seed', () => {
    expect(() => {
      new CrustPinningBackend(`crust://test.network`)
    }).toThrow(EmptySeedError)
  })
})
