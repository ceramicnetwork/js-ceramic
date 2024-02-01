/**
 * Testing utilites for did, did resolvers, and signing functionality
 */
import { CID } from 'multiformats/cid'
import { DID, DIDResolutionResult, VerifyJWSResult } from 'dids'
import { wrapDocument } from '@ceramicnetwork/3id-did-resolver'
import { parse as parseDidUrl } from 'did-resolver'
import * as KeyDidResolver from 'key-did-resolver'
import * as sha256 from '@stablelib/sha256'
import { decode as decodeMultiHash } from 'multiformats/hashes/digest'
import * as uint8arrays from 'uint8arrays'
import { CeramicApi } from '@ceramicnetwork/common'
import { jest } from '@jest/globals'

export const FAKE_CID_1 = CID.parse('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
export const FAKE_CID_2 = CID.parse('bafybeig6xv5nwphfmvcnektpnojts44jqcuam7bmye2pb54adnrtccjlsu')
export const FAKE_CID_3 = CID.parse('bafybeig6xv5nwphfmvcnektpnojts55jqcuam7bmye2pb54adnrtccjlsu')
export const FAKE_CID_4 = CID.parse('bafybeig6xv5nwphfmvcnektpnojts66jqcuam7bmye2pb54adnrtccjlsu')

export const DID_ID = 'did:3:k2t6wyfsu4pg0t2n4j8ms3s33xsgqjhtto04mvq8w5a2v5xo48idyz38l7ydki'

export const JWS_VERSION_0 = {
  payload: 'bbbb',
  signatures: [
    {
      protected:
        'eyJraWQiOiJkaWQ6MzprMnQ2d3lmc3U0cGcwdDJuNGo4bXMzczMzeHNncWpodHRvMDRtdnE4dzVhMnY1eG80OGlkeXozOGw3eWRraT92ZXJzaW9uPTAjc2lnbmluZyIsImFsZyI6IkVTMjU2SyJ9',
      signature: 'cccc',
    },
  ],
}

export const JWS_VERSION_1 = {
  payload: 'bbbb',
  signatures: [
    {
      protected:
        'ewogICAgImtpZCI6ImRpZDozOmsydDZ3eWZzdTRwZzB0Mm40ajhtczNzMzN4c2dxamh0dG8wNG12cTh3NWEydjV4bzQ4aWR5ejM4bDd5ZGtpP3ZlcnNpb249MSNzaWduaW5nIgp9',
      signature: 'cccc',
    },
  ],
}

export const COMMITS = {
  genesis: {
    header: {
      controllers: [DID_ID],
    },
    data: { much: 'data' },
  },
  genesisGenerated: {
    jws: {
      payload: 'bbbb',
      signatures: [
        {
          protected:
            'eyJraWQiOiJkaWQ6MzprMnQ2d3lmc3U0cGcwdDJuNGo4bXMzczMzeHNncWpodHRvMDRtdnE4dzVhMnY1eG80OGlkeXozOGw3eWRraT92ZXJzaW9uPTAjc2lnbmluZyIsImFsZyI6IkVTMjU2SyJ9',
          signature: 'cccc',
        },
      ],
      link: CID.parse('bafyreiau5pqllna6pewhp3w2hbvohxxeqsmffnwf6o2fwoln4ubbc6fldq'),
    },
    linkedBlock: {
      data: {
        much: 'data',
      },
      header: {
        controllers: [DID_ID],
      },
    },
  },
  r1: {
    desiredContent: { much: 'data', very: 'content' },
    commit: {
      jws: {
        payload: 'bbbb',
        signatures: [
          {
            protected:
              'eyJraWQiOiJkaWQ6MzprMnQ2d3lmc3U0cGcwdDJuNGo4bXMzczMzeHNncWpodHRvMDRtdnE4dzVhMnY1eG80OGlkeXozOGw3eWRraT92ZXJzaW9uPTAjc2lnbmluZyIsImFsZyI6IkVTMjU2SyJ9',
            signature: 'cccc',
          },
        ],
        link: 'bafyreia6chsgnfihmdrl2d36llrfevc6xgmgzryi3ittdg3j5ohdifb7he',
      },
      linkedPayload: {
        id: 'bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu',
        data: [
          {
            op: 'add',
            path: '/very',
            value: 'content',
          },
        ],
        prev: 'bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu',
        header: {},
      },
    },
  },
  r2: { commit: { proof: FAKE_CID_4, id: FAKE_CID_1, prev: FAKE_CID_2 } },
  proof: {
    chainId: 'fakechain:123',
  },
}

function resolutionResult(didUrl: string, optRotateDate?: string): DIDResolutionResult {
  const rotateDate = optRotateDate || new Date('2022-03-11T21:28:07.383Z').toISOString()
  const { did } = parseDidUrl(didUrl)!
  const isVersion0 = /version=0/.exec(didUrl)

  if (isVersion0) {
    return {
      didResolutionMetadata: { contentType: 'application/did+json' },
      didDocument: wrapDocument(
        {
          publicKeys: {
            signing: 'zQ3shwsCgFanBax6UiaLu1oGvM7vhuqoW88VBUiUTCeHbTeTV',
            encryption: 'z6LSfQabSbJzX8WAm1qdQcHCHTzVv8a2u6F7kmzdodfvUCo9',
          },
        },
        did
      ),
      didDocumentMetadata: {
        nextUpdate: rotateDate,
      },
    }
  }

  return {
    didResolutionMetadata: { contentType: 'application/did+json' },
    didDocument: wrapDocument(
      {
        publicKeys: {
          signing: 'zQ3shwsCgFanBax6UiaLu1oGvM7vhuqoW88VBUiUTCeHbTeTV',
          encryption: 'z6MkjKeH8SgVAYCvTBoyxx7uRJFGM2a9HUeFwfJfd6ctuA3X',
        },
      },
      did
    ),
    didDocumentMetadata: {
      updated: rotateDate,
    },
  }
}

export class DidTestUtils {
  static readonly verifyJWS = jest.fn(() => {
    return Promise.resolve({} as any as VerifyJWSResult)
  })
  static readonly threeIdResolver = {
    '3': async (did: string) => {
      return resolutionResult(did)
    },
  }

  static generateDID(id: string = DID_ID): DID {
    const did = new DID({})
    //@ts-ignore
    did._id = id
    return DidTestUtils.setDidToNotRotatedState(did)
  }

  static setDidToNotRotatedState(did: DID): DID {
    const keyDidResolver = KeyDidResolver.getResolver()
    did.setResolver({
      ...keyDidResolver,
      ...DidTestUtils.threeIdResolver,
    })

    const createJWS = jest.fn(async () => JWS_VERSION_0)
    did.createJWS = createJWS.bind(did)
    return did
  }

  static disableJwsVerification(did: DID): void {
    did.verifyJWS = DidTestUtils.verifyJWS.bind(did)
  }

  static apiForDid(did: DID): CeramicApi {
    return {
      getSupportedChains: jest.fn(async () => {
        return ['fakechain:123']
      }),
      did,
    } as unknown as CeramicApi
  }

  static rotateKey(did: DID, rotateDate: string) {
    const resolve = jest.fn(async (didUrl) => {
      return resolutionResult(didUrl, rotateDate)
    })
    did.resolve = resolve.bind(did)

    const createJWS = jest.fn(async () => JWS_VERSION_1)
    did.createJWS = createJWS.bind(did)
  }

  static hash(data: string): CID {
    const body = uint8arrays.concat([
      uint8arrays.fromString('1220', 'base16'),
      sha256.hash(uint8arrays.fromString(data)),
    ])
    return CID.create(1, 0x12, decodeMultiHash(body))
  }

  static serialize(data: any): any {
    if (Array.isArray(data)) {
      const serialized = []
      for (const item of data) {
        serialized.push(DidTestUtils.serialize(item))
      }
      return serialized
    }
    const cid = CID.asCID(data)
    if (!cid && typeof data === 'object') {
      const serialized: Record<string, any> = {}
      for (const prop in data) {
        serialized[prop] = DidTestUtils.serialize(data[prop])
      }
      return serialized
    }
    if (cid) {
      return data.toString()
    }
    return data
  }
}
