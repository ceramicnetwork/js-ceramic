import { expect, jest } from '@jest/globals'
import {
  LoggerProvider,
  AnchorRequestStatusName,
  type fetchJson,
  type IpfsApi,
} from '@ceramicnetwork/common'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { createCeramic } from '../../../__tests__/create-ceramic.js'
import { createDidAnchorServiceAuth } from '../../../__tests__/create-did-anchor-service-auth.js'
import { AuthenticatedEthereumAnchorService } from '../ethereum-anchor-service.js'
import { AnchorRequestStore } from '../../../store/anchor-request-store.js'
import type { AnchorLoopHandler } from '../../anchor-service.js'
import { Ceramic, VersionInfo } from '../../../ceramic.js'
import { BaseTestUtils } from '@ceramicnetwork/base-test-utils'

const FAUX_ANCHOR_STORE = {
  save: jest.fn(),
  infiniteList: function* () {
    yield null
  },
} as unknown as AnchorRequestStore
const FAUX_HANDLER: AnchorLoopHandler = {
  async handle(): Promise<boolean> {
    return true
  },
}

const diagnosticsLogger = new LoggerProvider().getDiagnosticsLogger()
const VERSION_INFO: VersionInfo = { cliPackageVersion: '', gitHash: '', ceramicOneVersion: '' }

describe('AuthenticatedEthereumAnchorServiceTest', () => {
  let ipfs: IpfsApi
  let ceramic: Ceramic

  beforeAll(async () => {
    ipfs = await createIPFS()
    ceramic = await createCeramic(ipfs, { streamCacheLimit: 1, anchorOnRequest: true })
  })

  afterAll(async () => {
    ceramic && (await ceramic.close())
    ipfs && (await ipfs.stop())
  })

  test('Should authenticate header during call to supported_chains endpoint in init()', async () => {
    const fauxFetchJson = jest.fn(async () => {
      return { supportedChains: ['eip155:1'] }
    }) as unknown as typeof fetchJson

    const url = 'http://example.com'
    const chainIdUrl = url + '/api/v0/service-info/supported_chains'

    const auth = createDidAnchorServiceAuth(url, ceramic.signer, diagnosticsLogger, fauxFetchJson)
    const signRequestSpy = jest.spyOn(auth, 'signRequest')
    const anchorService = new AuthenticatedEthereumAnchorService(
      auth,
      url,
      url,
      diagnosticsLogger,
      VERSION_INFO
    )

    jest.spyOn(anchorService.validator, 'init').mockImplementation(async () => {
      // Do Nothing
    })

    await anchorService.init(FAUX_ANCHOR_STORE, FAUX_HANDLER)

    expect(signRequestSpy).toHaveBeenCalledTimes(1)
    const signRequestResult = (await signRequestSpy.mock.results[0].value) as any
    const signRequestResultOpts = signRequestResult.request.opts
    expect(fauxFetchJson).toBeCalledWith(chainIdUrl, signRequestResultOpts)
  })

  test('Should authenticate header when creating anchor requests', async () => {
    const fauxFetchJson = jest.fn(async (url) => {
      if (url === 'http://example.com/api/v0/service-info/supported_chains') {
        return {
          supportedChains: ['eip155:1'],
        }
      }
      return { status: AnchorRequestStatusName.PENDING }
    }) as unknown as typeof fetchJson

    const url = 'http://example.com'
    const requestsUrl = url + '/api/v0/requests'

    const auth = createDidAnchorServiceAuth(url, ceramic.signer, diagnosticsLogger, fauxFetchJson)
    const signRequestSpy = jest.spyOn(auth, 'signRequest')
    const anchorService = new AuthenticatedEthereumAnchorService(
      auth,
      url,
      url,
      diagnosticsLogger,
      VERSION_INFO
    )
    jest.spyOn(anchorService.validator, 'init').mockImplementation(async () => {
      // Do Nothing
    })
    await anchorService.init(FAUX_ANCHOR_STORE, FAUX_HANDLER)

    await anchorService.requestAnchor(BaseTestUtils.randomStreamID(), BaseTestUtils.randomCID())

    expect(signRequestSpy).toHaveBeenCalledTimes(2) // 1 to get supported chains + 1 to send request
    const signRequestResult = (await signRequestSpy.mock.results[1].value) as any
    const signRequestResultOpts = signRequestResult.request.opts
    expect(fauxFetchJson).toBeCalledWith(
      requestsUrl,
      expect.objectContaining(signRequestResultOpts)
    )
  })
})
