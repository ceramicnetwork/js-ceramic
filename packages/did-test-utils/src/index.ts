/**
 * Testing utilities for did, did resolvers, and signing functionality
 */
import { CID } from 'multiformats/cid'
import type { DagJWS, DID, DIDResolutionResult } from 'dids'
import { encodePayload } from 'dag-jose-utils'
import { wrapDocument } from '@ceramicnetwork/3id-did-resolver'
import * as KeyDidResolver from 'key-did-resolver'
import * as sha256 from '@stablelib/sha256'
import { decode as decodeMultiHash } from 'multiformats/hashes/digest'
import * as uint8arrays from 'uint8arrays'
import {
  AnchorOpts,
  AnchorStatus,
  CeramicCommit,
  CeramicSigner,
  CreateOpts,
  IntoSigner,
  LoadOpts,
  MultiQuery,
  Stream,
  StreamReaderWriter,
  UpdateOpts,
} from '@ceramicnetwork/common'
import { jest } from '@jest/globals'
import { StreamID } from '@ceramicnetwork/streamid'
import { parse as parseDidUrl } from 'did-resolver'
import { VerificationMethod } from 'did-resolver'

jest.unstable_mockModule('did-jwt', () => {
  return {
    // TODO - We should test for when this function throws as well
    // Mock: Blindly accept a signature
    verifyJWS: (
      _jws: string,
      _keys: VerificationMethod | VerificationMethod[]
    ): VerificationMethod => {
      return {
        id: '',
        controller: '',
        type: '',
      }
    },
    // And these functions are required for the test to run ¯\_(ツ)_/¯
    resolveX25519Encrypters: () => {
      return []
    },
    createJWE: () => {
      return {}
    },
  }
})

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

export class RotatingSigner implements IntoSigner {
  readonly _did: DID
  readonly _signer: CeramicSigner
  _rotateDate?: string

  constructor(did: DID, signer: CeramicSigner) {
    this._did = did
    this._signer = signer
  }

  get signer(): CeramicSigner {
    return this._signer
  }
}

export interface GenerateDidOpts {
  id?: string
  jws?: DagJWS
  verify?: boolean
}

export class DidTestUtils {
  static readonly verifyJWS = jest.fn(() => {
    return Promise.resolve({
      id: '',
      controller: '',
      type: '',
    })
  })
  static readonly threeIdResolver = {
    '3': async (did: string) => {
      return DidTestUtils.resolutionResultV0(did)
    },
  }

  static async resolutionResultV1(did: string, date?: string): Promise<DIDResolutionResult> {
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
        nextUpdate: date,
      },
    }
  }

  static async resolutionResultV0(did: string, date?: string): Promise<DIDResolutionResult> {
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
        updated: date,
      },
    }
  }

  static async generateDID(opts: GenerateDidOpts): Promise<DID> {
    const { DID } = await import('dids')
    const did = new DID({})
    //@ts-ignore
    did._id = opts.id || DID_ID

    const keyDidResolver = KeyDidResolver.getResolver()
    did.setResolver({
      ...keyDidResolver,
      ...DidTestUtils.threeIdResolver,
    })

    const createDagJWS = jest.fn(async (payload: Record<string, any>) => {
      const { linkedBlock } = await encodePayload(payload)
      const jws = opts.jws || JWS_VERSION_0
      return { jws, linkedBlock }
    })
    did.createDagJWS = createDagJWS.bind(did)
    did.verifyJWS = this.verifyJWS.bind(did)
    return did
  }

  static async rotatingSigner(opts: GenerateDidOpts): Promise<RotatingSigner> {
    const generatedDid = await this.generateDID(opts)
    const signer = CeramicSigner.fromDID(generatedDid)
    const testSigner = new RotatingSigner(generatedDid, signer)
    const resolve = jest.fn(async (didUrl) => {
      const { did } = parseDidUrl(didUrl)!
      const isVersion0 = /version=0/.exec(didUrl)
      if (isVersion0) {
        return DidTestUtils.resolutionResultV1(did, testSigner._rotateDate)
      } else {
        return DidTestUtils.resolutionResultV0(did, testSigner._rotateDate)
      }
    })
    generatedDid.resolve = resolve.bind(generatedDid)
    return testSigner
  }

  static withRotationDate(signer: RotatingSigner, rotateDate: string) {
    signer._rotateDate = rotateDate
    const createJWS = jest.fn(async () => JWS_VERSION_1)
    signer._did.createJWS = createJWS.bind(signer._did)
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

  public static api(signer: IntoSigner): StreamReaderWriter {
    return new TestReaderWriter(signer)
  }
}

export class TestReaderWriter implements StreamReaderWriter {
  constructor(private readonly _signer: IntoSigner) {}

  signerFromDID(did: DID): CeramicSigner {
    return CeramicSigner.fromDID(did)
  }

  multiQuery(_queries: Array<MultiQuery>, _timeout?: number): Promise<Record<string, Stream>> {
    return Promise.reject(`Can't multiquery`)
  }

  loadStream<T extends Stream>(_streamId: StreamID, _opts?: LoadOpts): Promise<T> {
    return Promise.reject(`Can't load stream`)
  }

  get signer(): CeramicSigner {
    return this._signer.signer
  }

  public createStreamFromGenesis<T extends Stream>(
    _type: number,
    _genesis: any,
    _opts?: CreateOpts
  ): Promise<T> {
    return Promise.reject(`Can't create stream`)
  }

  public applyCommit<T extends Stream>(
    _streamId: StreamID | string,
    _commit: CeramicCommit,
    _opts?: UpdateOpts
  ): Promise<T> {
    return Promise.reject(`Can't apply commit`)
  }

  requestAnchor(
    _streamId: StreamID | string,
    _opts?: LoadOpts & AnchorOpts
  ): Promise<AnchorStatus> {
    return Promise.reject(`Can't request anchor`)
  }
}
