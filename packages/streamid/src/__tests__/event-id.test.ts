import { EventID } from '../event-id.js'
import { base16 } from 'multiformats/bases/base16'

const separator = 'kh4q0ozorrgaq2mezktnrmdwleo1d'
const controller = 'did:key:z6MkgSV3tAuw7gUWqKCUY7ae6uWNxqYgdwPhUJbJhF9EFXm9'
const init = 'bagcqceraplay4erv6l32qrki522uhiz7rf46xccwniw7ypmvs3cvu2b3oulq'
const eventHeight = 255 // so we get 2 bytes b'\x18\xff'
const eventCid = 'bafyreihu557meceujusxajkaro3epfe6nnzjgbjaxsapgtml7ox5ezb5qy'
const eventIDHex =
  'fce0105002a30541a6fbdca4645cc7c072ff729ea683b751718ff01711220f4ef7ec208944d257025408bb647949e6b72930520bc80f34d8bfbafd2643d86'
const eventID =
  'knbm0mn8ocjxseb7rtv5nshk6icfol0d8o0wn07xsn3uecgeewtdqa5tjx0md38l8yal1wa3fghvu4kvzecgoru0jv2juk4g6'
const eventIDBytes = Uint8Array.from([
  206, 1, 48, 0, 42, 48, 84, 26, 111, 189, 202, 70, 69, 204, 124, 7, 47, 247, 41, 234, 104, 59, 117,
  23, 24, 255, 1, 113, 18, 32, 244, 239, 126, 194, 8, 148, 77, 37, 112, 37, 64, 139, 182, 71, 148,
  158, 107, 114, 147, 5, 32, 188, 128, 243, 77, 139, 251, 175, 210, 100, 61, 134,
])

describe('Event Id: ', () => {
  test('create by parts', () => {
    const eventid = EventID.create('mainnet', separator, controller, init, eventHeight, eventCid)
    const hexstring = base16.encode(eventid.bytes)
    expect(hexstring).toEqual(eventIDHex)
  })

  test('create from string', () => {
    const eventid = EventID.fromString(eventID)
    const hexstring = base16.encode(eventid.bytes)
    expect(hexstring).toEqual(eventIDHex)
  })

  test('create from bytes', () => {
    const eventid = EventID.fromBytes(eventIDBytes)
    const hexstring = base16.encode(eventid.bytes)
    expect(hexstring).toEqual(eventIDHex)
  })

  test('roundtrip', () => {
    const eventid = EventID.fromString(eventID)
    const eventID2 = eventid.toString()
    expect(eventID).toEqual(eventID2)
  })

  test('roundtrip larger event height', () => {
    const eventid = EventID.create('mainnet', separator, controller, init, 3333, eventCid)
    const eventid2 = EventID.fromString(eventid.toString())
    expect(eventid.equals(eventid2)).toBeTruthy()
  })

  test('equal', () => {
    const eventid = EventID.create('mainnet', separator, controller, init, eventHeight, eventCid)
    const eventid2 = EventID.fromString(eventID)
    expect(eventid.equals(eventid2)).toBeTruthy()
  })

  test('not equal', () => {
    const eventid = EventID.create('mainnet', separator, controller, init, eventHeight, eventCid)
    const eventid2 = EventID.create('mainnet', separator, controller, init, 10, eventCid)
    expect(eventid.equals(eventid2)).toBeFalsy()
  })

  test('invalid eventid string', () => {
    expect(() => EventID.fromString('knbm43eediggnrlswgh1oqxfn5hs26el')).toThrow('Invalid EventID:')
  })
})
