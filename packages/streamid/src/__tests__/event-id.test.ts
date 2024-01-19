import { EventID } from '../event-id.js'
import { base16 } from 'multiformats/bases/base16'

const separatorKey = 'model'
const separatorValue = 'kh4q0ozorrgaq2mezktnrmdwleo1d'
const controller = 'did:key:z6MkgSV3tAuw7gUWqKCUY7ae6uWNxqYgdwPhUJbJhF9EFXm9'
const init = 'bagcqceraplay4erv6l32qrki522uhiz7rf46xccwniw7ypmvs3cvu2b3oulq'
const eventHeight = 255 // so we get 2 bytes b'\x18\xff'
const eventCid = 'bafyreihu557meceujusxajkaro3epfe6nnzjgbjaxsapgtml7ox5ezb5qy'
const eventIDHex =
  'fce0105007e710e217fa0e25945cc7c072ff729ea683b751718ff01711220f4ef7ec208944d257025408bb647949e6b72930520bc80f34d8bfbafd2643d86'
const eventID =
  'knbm0mndidwd1ltaf8flyg7q8c9yjalvg49z0r46diobj80sjb28zpkd39sfndxlaqpb9v036o0a4dnjkqbydu4vaxnikivt2'
const eventIDBytes = Uint8Array.from([
  206, 1, 5, 0, 126, 113, 14, 33, 127, 160, 226, 89, 69, 204, 124, 7, 47, 247, 41, 234, 104, 59,
  117, 23, 24, 255, 1, 113, 18, 32, 244, 239, 126, 194, 8, 148, 77, 37, 112, 37, 64, 139, 182, 71,
  148, 158, 107, 114, 147, 5, 32, 188, 128, 243, 77, 139, 251, 175, 210, 100, 61, 134,
])

describe('Event Id: ', () => {
  describe('create by parts', () => {
    test('mainnet', () => {
      const eventid = EventID.create(
        'mainnet',
        0,
        separatorKey,
        separatorValue,
        controller,
        init,
        eventHeight,
        eventCid
      )
      const hexstring = base16.encode(eventid.bytes)
      expect(hexstring).toEqual(eventIDHex)
    })

    test('testnet-clay', () => {
      const eventid = EventID.create(
        'testnet-clay',
        0,
        separatorKey,
        separatorValue,
        controller,
        init,
        eventHeight,
        eventCid
      )
      const hexstring = base16.encode(eventid.bytes)
      expect(hexstring).toEqual(
        'fce0105017e710e217fa0e25945cc7c072ff729ea683b751718ff01711220f4ef7ec208944d257025408bb647949e6b72930520bc80f34d8bfbafd2643d86'
      )
    })

    test('dev-unstable', () => {
      const eventid = EventID.create(
        'dev-unstable',
        0,
        separatorKey,
        separatorValue,
        controller,
        init,
        eventHeight,
        eventCid
      )
      const hexstring = base16.encode(eventid.bytes)
      expect(hexstring).toEqual(
        'fce0105027e710e217fa0e25945cc7c072ff729ea683b751718ff01711220f4ef7ec208944d257025408bb647949e6b72930520bc80f34d8bfbafd2643d86'
      )
    })

    test('inmemory', () => {
      const eventid = EventID.create(
        'inmemory',
        0,
        separatorKey,
        separatorValue,
        controller,
        init,
        eventHeight,
        eventCid
      )
      const hexstring = base16.encode(eventid.bytes)
      expect(hexstring).toEqual(
        'fce0105ff017e710e217fa0e25945cc7c072ff729ea683b751718ff01711220f4ef7ec208944d257025408bb647949e6b72930520bc80f34d8bfbafd2643d86'
      )
    })

    test('local', () => {
      const eventid = EventID.create(
        `local`,
        0xce4a441c,
        separatorKey,
        separatorValue,
        controller,
        init,
        eventHeight,
        eventCid
      )
      const hexstring = base16.encode(eventid.bytes)
      expect(hexstring).toEqual(
        'fce01059c88a9f21c7e710e217fa0e25945cc7c072ff729ea683b751718ff01711220f4ef7ec208944d257025408bb647949e6b72930520bc80f34d8bfbafd2643d86'
      )
    })
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
    const eventid = EventID.create(
      'mainnet',
      0,
      separatorKey,
      separatorValue,
      controller,
      init,
      3333,
      eventCid
    )
    const eventid2 = EventID.fromString(eventid.toString())
    expect(eventid.equals(eventid2)).toBeTruthy()
  })

  test('equal', () => {
    const eventid = EventID.create(
      'mainnet',
      0,
      separatorKey,
      separatorValue,
      controller,
      init,
      eventHeight,
      eventCid
    )
    const eventid2 = EventID.fromString(eventID)
    expect(eventid.equals(eventid2)).toBeTruthy()
  })

  test('not equal', () => {
    const eventid = EventID.create(
      'mainnet',
      0,
      separatorKey,
      separatorValue,
      controller,
      init,
      eventHeight,
      eventCid
    )
    const eventid2 = EventID.create(
      'mainnet',
      0,
      separatorKey,
      separatorValue,
      controller,
      init,
      10,
      eventCid
    )
    expect(eventid.equals(eventid2)).toBeFalsy()
  })

  test('invalid eventid string', () => {
    expect(() => EventID.fromString('knbm43eediggnrlswgh1oqxfn5hs26el')).toThrow('Invalid EventID:')
  })

  test('can create a random eventid', () => {
    const eventid = EventID.createRandom('mainnet', 0)
    const eventid2 = EventID.createRandom('mainnet', 0)
    expect(eventid).toBeInstanceOf(EventID)
    expect(eventid2).toBeInstanceOf(EventID)
    expect(eventid.toString()).not.toEqual(eventid2.toString())
  })
})
