import { expect, jest } from '@jest/globals'
import { LoggerProvider, type fetchJson } from '@ceramicnetwork/common'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { createCeramic } from '../../../__tests__/create-ceramic.js'
import { createDidAnchorServiceAuth } from '../../../__tests__/create-did-anchor-service-auth.js'
import { AuthenticatedEthereumAnchorService } from '../ethereum-anchor-service.js'
import { generateFakeCarFile } from './generateFakeCarFile.js'
import { AnchorRequestStatusName } from '@ceramicnetwork/codecs'
import { lastValueFrom } from 'rxjs'

const diagnosticsLogger = new LoggerProvider().getDiagnosticsLogger()

describe('AuthenticatedEthereumAnchorServiceTest', () => {
  let ipfs: any
  let ceramic: any

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

    const auth = createDidAnchorServiceAuth(url, ceramic, diagnosticsLogger, fauxFetchJson)
    const signRequestSpy = jest.spyOn(auth, 'signRequest')
    const anchorService = new AuthenticatedEthereumAnchorService(
      auth,
      url,
      url,
      diagnosticsLogger,
      100
    )

    jest.spyOn(anchorService.validator, 'init').mockImplementation(async () => {
      // Do Nothing
    })

    await anchorService.init()

    expect(signRequestSpy).toHaveBeenCalledTimes(1)
    const signRequestResult = (await signRequestSpy.mock.results[0].value) as any
    const signRequestResultOpts = signRequestResult.request.opts
    expect(fauxFetchJson).toBeCalledWith(chainIdUrl, signRequestResultOpts)
  })

  test('Should authenticate header when creating anchor requests', async () => {
    const fauxFetchJson = jest.fn(async () => {
      return { status: AnchorRequestStatusName.PENDING }
    }) as unknown as typeof fetchJson

    const url = 'http://example.com'
    const requestsUrl = url + '/api/v0/requests'

    const auth = createDidAnchorServiceAuth(url, ceramic, diagnosticsLogger, fauxFetchJson)
    const signRequestSpy = jest.spyOn(auth, 'signRequest')
    const anchorService = new AuthenticatedEthereumAnchorService(
      auth,
      url,
      url,
      diagnosticsLogger,
      100
    )

    const observable = await anchorService.requestAnchor(generateFakeCarFile(), false)
    const anchorStatus = await lastValueFrom(observable)
    expect(anchorStatus.status).toEqual(AnchorRequestStatusName.FAILED) // because the response didn't match the expected format

    expect(signRequestSpy).toHaveBeenCalledTimes(1)
    const signRequestResult = (await signRequestSpy.mock.results[0].value) as any
    const signRequestResultOpts = signRequestResult.request.opts
    expect(fauxFetchJson).toBeCalledWith(requestsUrl, signRequestResultOpts)
  })
})
