import { jest } from '@jest/globals'
import { CID } from 'multiformats/cid'
import { StreamID } from '@ceramicnetwork/streamid'
import { whenSubscriptionDone } from '../../../__tests__/when-subscription-done.util.js'
import * as uint8arrays from 'uint8arrays'

const FAKE_STREAM_ID = StreamID.fromString(
  'kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s'
)
const FAKE_TIP_CID = CID.parse('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_TIP_BLOCK = uint8arrays.fromString(
  'omdwYXlsb2FkWCQBcRIgKUl41INh3f94akTEnGil+GM7X9txIueMaQ/TtVsmEctqc2lnbmF0dXJlc4GiaXByb3RlY3RlZFiBeyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDprZXk6ejZNa3diNUhIWHlmMnB4dnE3TlU0dWVQWEhtUllOWkRFYlY0V1dRWnczTk1keWJBI3o2TWt3YjVISFh5ZjJweHZxN05VNHVlUFhIbVJZTlpERWJWNFdXUVp3M05NZHliQSJ9aXNpZ25hdHVyZVhAQPkqeTA+Haj9wNTVKDTAK4LDinqvLL9GGtevM+FUY5R9zdlYqq0c8pj3JaY15RJHhMuwqIEK1ZAnWmhEkjIxDA',
  'base64'
)
const FAKE_TIP_LINK_CID = CID.parse('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_TIP_LINK_BLOCK = uint8arrays.fromString(
  'omdwYXlsb2FkWCQBcRIgKUl41INh3f94akTEnGil+GM7X9txIueMaQ/TtVsmEctqc2lnbmF0dXJlc4GiaXByb3RlY3RlZFiBeyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDprZXk6ejZNa3diNUhIWHlmMnB4dnE3TlU0dWVQWEhtUllOWkRFYlY0V1dRWnczTk1keWJBI3o2TWt3YjVISFh5ZjJweHZxN05VNHVlUFhIbVJZTlpERWJWNFdXUVp3M05NZHliQSJ9aXNpZ25hdHVyZVhAQPkqeTA+Haj9wNTVKDTAK4LDinqvLL9GGtevM+FUY5R9zdlYqq0c8pj3JaY15RJHhMuwqIEK1ZAnWmhEkjIxDA',
  'base64'
)
const FAKE_GENESIS_CID = CID.parse('bafyreifhtimtstonfn26qhbvmysxe4xxkjmazrz4hx6ajeyifnnavgdpie')
const FAKE_GENESIS_BLOCK = uint8arrays.fromString(
  'omdwYXlsb2FkWCQBcRIgKUl41INh3f94akTEnGil+GM7X9txIueMaQ/TtVsmEctqc2lnbmF0dXJlc4GiaXByb3RlY3RlZFiBeyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDprZXk6ejZNa3diNUhIWHlmMnB4dnE3TlU0dWVQWEhtUllOWkRFYlY0V1dRWnczTk1keWJBI3o2TWt3YjVISFh5ZjJweHZxN05VNHVlUFhIbVJZTlpERWJWNFdXUVp3M05NZHliQSJ9aXNpZ25hdHVyZVhAQPkqeTA+Haj9wNTVKDTAK4LDinqvLL9GGtevM+FUY5R9zdlYqq0c8pj3JaY15RJHhMuwqIEK1ZAnWmhEkjIxDA',
  'base64'
)
const FAKE_GENESIS_LINK_CID = CID.parse(
  'bagcqcerabssdaiiphihqlu5fsxl34h7nyu3bn3ss3ejilp6idgc7ipyn6htq'
)
const FAKE_GENESIS_LINK_BLOCK = uint8arrays.fromString(
  'omdwYXlsb2FkWCQBcRIgKUl41INh3f94akTEnGil+GM7X9txIueMaQ/TtVsmEctqc2lnbmF0dXJlc4GiaXByb3RlY3RlZFiBeyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDprZXk6ejZNa3diNUhIWHlmMnB4dnE3TlU0dWVQWEhtUllOWkRFYlY0V1dRWnczTk1keWJBI3o2TWt3YjVISFh5ZjJweHZxN05VNHVlUFhIbVJZTlpERWJWNFdXUVp3M05NZHliQSJ9aXNpZ25hdHVyZVhAQPkqeTA+Haj9wNTVKDTAK4LDinqvLL9GGtevM+FUY5R9zdlYqq0c8pj3JaY15RJHhMuwqIEK1ZAnWmhEkjIxDA',
  'base64'
)
const FAKE_TIP_CACAO_CID = CID.parse(
  'bagcqcerabssdaiiphihqlu5fsxl34h7nyu3bn3ss3ejilp6idgc7ipyn6htq'
)
const FAKE_TIP_CACAO_BLOCK = uint8arrays.fromString(
  'omdwYXlsb2FkWCQBcRIgKUl41INh3f94akTEnGil+GM7X9txIueMaQ/TtVsmEctqc2lnbmF0dXJlc4GiaXByb3RlY3RlZFiBeyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDprZXk6ejZNa3diNUhIWHlmMnB4dnE3TlU0dWVQWEhtUllOWkRFYlY0V1dRWnczTk1keWJBI3o2TWt3YjVISFh5ZjJweHZxN05VNHVlUFhIbVJZTlpERWJWNFdXUVp3M05NZHliQSJ9aXNpZ25hdHVyZVhAQPkqeTA+Haj9wNTVKDTAK4LDinqvLL9GGtevM+FUY5R9zdlYqq0c8pj3JaY15RJHhMuwqIEK1ZAnWmhEkjIxDA',
  'base64'
)

const MAX_FAILED_ATTEMPTS = 2
let attemptNum = 0

const casProcessingResponse = {
  status: 'PROCESSING',
  message: `CAS is finally available; nonce: ${Math.random()}`,
}

jest.unstable_mockModule('cross-fetch', () => {
  const fetchFunc = jest.fn(async (url: string, opts: any = {}) => ({
    ok: true,
    json: async () => {
      attemptNum += 1
      if (attemptNum <= MAX_FAILED_ATTEMPTS + 1) {
        throw new Error(`Cas is unavailable`)
      }
      return casProcessingResponse
    },
  }))
  return {
    default: fetchFunc,
  }
})

jest.setTimeout(20000)

let ipfs: any
let ceramic: any

afterAll(async () => {
  ceramic && (await ceramic.close())
  ipfs && (await ipfs.stop())
})

test('re-request an anchor till get a response - authenticated request', async () => {
  const common = await import('@ceramicnetwork/common')
  const eas = await import('../ethereum-anchor-service.js')
  const { createIPFS } = await import('@ceramicnetwork/ipfs-daemon')
  const { createCeramic } = await import('../../../__tests__/create-ceramic.js')
  const { createDidAnchorServiceAuth } = await import(
    '../../../__tests__/create-did-anchor-service-auth.js'
  )
  const loggerProvider = new common.LoggerProvider()
  const diagnosticsLogger = loggerProvider.getDiagnosticsLogger()
  const errSpy = jest.spyOn(diagnosticsLogger, 'err')
  const url = 'http://example.com'

  ipfs = await createIPFS()
  ceramic = await createCeramic(ipfs, { streamCacheLimit: 1, anchorOnRequest: true })
  const { auth } = createDidAnchorServiceAuth(url, ceramic, diagnosticsLogger)
  const anchorService = new eas.AuthenticatedEthereumAnchorService(
    auth,
    url,
    diagnosticsLogger,
    100
  )

  let lastResponse: any
  const subscription = anchorService
    .requestAnchor({
      streamId: FAKE_STREAM_ID,
      timestampISO: new Date().toISOString(),
      genesisCid: FAKE_GENESIS_CID,
      genesisBlock: FAKE_GENESIS_BLOCK,
      genesisLinkCid: FAKE_GENESIS_LINK_CID,
      genesisLinkBlock: FAKE_GENESIS_LINK_BLOCK,
      tip: FAKE_TIP_CID,
      tipBlock: FAKE_TIP_BLOCK,
      tipLinkCid: FAKE_TIP_LINK_CID,
      tipLinkBlock: FAKE_TIP_LINK_BLOCK,
      tipCacaoCid: FAKE_TIP_CACAO_CID,
      tipCacaoBlock: FAKE_TIP_CACAO_BLOCK,
    })
    .subscribe((response) => {
      if (response.status === common.AnchorStatus.PROCESSING) {
        lastResponse = response
        subscription.unsubscribe()
      }
    })
  await whenSubscriptionDone(subscription)
  expect(lastResponse.message).toEqual(casProcessingResponse.message)
  expect(errSpy).toBeCalledTimes(3)
})
