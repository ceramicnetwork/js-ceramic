import { describe, expect, test } from '@jest/globals'
import {
  CustomMainnetCasError,
  DEFAULT_ANCHOR_SERVICE_URLS,
  makeAnchorServiceUrl,
} from '../anchoring.js'
import { Networks } from '@ceramicnetwork/common'

describe('makeAnchorServiceUrl', () => {
  const CUSTOM_URL = 'https://cas.com'

  test('pass from config', () => {
    expect(makeAnchorServiceUrl('hello', Networks.INMEMORY)).toEqual('hello')
  })
  test('drop trailing slashes', () => {
    const trailingSlash = `${CUSTOM_URL}/`
    const doubleTrailingSlash = `${CUSTOM_URL}//`
    expect(makeAnchorServiceUrl(CUSTOM_URL, Networks.INMEMORY)).toEqual(CUSTOM_URL)
    expect(makeAnchorServiceUrl(trailingSlash, Networks.INMEMORY)).toEqual(CUSTOM_URL)
    expect(makeAnchorServiceUrl(doubleTrailingSlash, Networks.INMEMORY)).toEqual(CUSTOM_URL)
  })
  test('pass default by network', () => {
    expect(makeAnchorServiceUrl(undefined, Networks.MAINNET)).toEqual(
      DEFAULT_ANCHOR_SERVICE_URLS[Networks.MAINNET]
    )
  })
  test('throw on custom CAS on mainnet', () => {
    expect(() => makeAnchorServiceUrl(CUSTOM_URL, Networks.MAINNET)).toThrow(CustomMainnetCasError)
    expect(() => makeAnchorServiceUrl(CUSTOM_URL, Networks.ELP)).toThrow(CustomMainnetCasError)
    const casInternal = 'https://cas-internal.3boxlabs.com'
    expect(makeAnchorServiceUrl(casInternal, Networks.MAINNET)).toEqual(casInternal)
    const casDirect = 'https://cas-direct.3boxlabs.com'
    expect(makeAnchorServiceUrl(casDirect, Networks.ELP)).toEqual(casDirect)
  })
})
