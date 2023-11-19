import { describe, expect, test } from '@jest/globals'
import {
  CustomMainnetCasError,
  DEFAULT_ANCHOR_SERVICE_URLS,
  makeAnchorService,
  makeAnchorServiceUrl,
} from '../anchoring.js'
import { LoggerProvider, Networks } from '@ceramicnetwork/common'
import { InMemoryAnchorService } from '../../anchor/memory/in-memory-anchor-service.js'
import {
  AuthenticatedEthereumAnchorService,
  EthereumAnchorService,
} from '../../anchor/ethereum/ethereum-anchor-service.js'

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
    const casInternal = 'https://cas-internal.3boxlabs.com'
    expect(makeAnchorServiceUrl(casInternal, Networks.MAINNET)).toEqual(casInternal)
    const casDirect = 'https://cas-direct.3boxlabs.com'
    expect(makeAnchorServiceUrl(casDirect, Networks.MAINNET)).toEqual(casDirect)
  })
})

describe('makeAnchorService', () => {
  const logger = new LoggerProvider().getDiagnosticsLogger()
  test('readOnly means null', () => {
    const result = makeAnchorService({ readOnly: true }, '', Networks.MAINNET, logger)
    expect(result).toBeInstanceOf(EthereumAnchorService)
  })
  test('inmemory', () => {
    const result = makeAnchorService({ readOnly: false }, '', Networks.INMEMORY, logger)
    expect(result).toBeInstanceOf(InMemoryAnchorService)
  })
  test('auth', () => {
    const result = makeAnchorService(
      { readOnly: false, anchorServiceAuthMethod: 'auth' },
      '',
      Networks.MAINNET,
      logger
    )
    expect(result).toBeInstanceOf(AuthenticatedEthereumAnchorService)
  })
  test('no auth', () => {
    const result = makeAnchorService({ readOnly: false }, '', Networks.MAINNET, logger)
    expect(result).toBeInstanceOf(EthereumAnchorService)
  })
})
