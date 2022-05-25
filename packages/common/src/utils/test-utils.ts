import type { StreamState, Stream } from '../stream.js'
import { filter } from 'rxjs/operators'
import { BehaviorSubject, lastValueFrom } from 'rxjs'
import { RunningStateLike } from '../running-state-like.js'
import { StreamID } from '@ceramicnetwork/streamid'
import { CID } from 'multiformats/cid'
import * as uint8arrays from 'uint8arrays'
import * as random from '@stablelib/random'
import { decode as decodeMultiHash } from 'multiformats/hashes/digest'
import type { DID } from 'dids'
import { parse as parseDidUrl } from 'did-resolver'
import { wrapDocument } from '@ceramicnetwork/3id-did-resolver'
import * as KeyDidResolver from 'key-did-resolver'

const SHA256_CODE = 0x12

class FakeRunningState extends BehaviorSubject<StreamState> implements RunningStateLike {
  readonly id: StreamID
  readonly state: StreamState

  constructor(value: StreamState) {
    super(value)
    this.state = this.value
    this.id = new StreamID(this.state.type, this.state.log[0].cid)
  }
}

const jwsForVersion0 = {
  payload: 'bbbb',
  signatures: [
    {
      protected:
        'eyJraWQiOiJkaWQ6MzprMnQ2d3lmc3U0cGcwdDJuNGo4bXMzczMzeHNncWpodHRvMDRtdnE4dzVhMnY1eG80OGlkeXozOGw3eWRraT92ZXJzaW9uPTAjc2lnbmluZyIsImFsZyI6IkVTMjU2SyJ9',
      signature: 'cccc',
    },
  ],
}

const jwsForVersion1 = {
  payload: 'bbbb',
  signatures: [
    {
      protected:
        'ewogICAgImtpZCI6ImRpZDozOmsydDZ3eWZzdTRwZzB0Mm40ajhtczNzMzN4c2dxamh0dG8wNG12cTh3NWEydjV4bzQ4aWR5ejM4bDd5ZGtpP3ZlcnNpb249MSNzaWduaW5nIgp9',
      signature: 'cccc',
    },
  ],
}

const ThreeIdResolver = {
  '3': async (did) => ({
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
    didDocumentMetadata: {},
  }),
}

export class TestUtils {
  /**
   * Given a stream and a predicate that operates on the stream state, continuously waits for
   * changes to the stream until the predicate returns true.
   * @param stream
   * @param timeout - how long to wait for
   * @param predicate - function that takes the stream's StreamState as input and returns true when this function can stop waiting
   * @param onFailure - function called if we time out before the predicate becomes true
   */
  static async waitForState(
    stream: Stream,
    timeout: number,
    predicate: (state: StreamState) => boolean,
    onFailure: () => void
  ): Promise<void> {
    if (predicate(stream.state)) return
    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, timeout))
    // We do not expect this promise to return anything, so set `defaultValue` to `undefined`
    const completionPromise = lastValueFrom(stream.pipe(filter((state) => predicate(state))), {
      defaultValue: undefined,
    })
    await Promise.race([timeoutPromise, completionPromise])
    if (!predicate(stream.state)) {
      onFailure()
    }
  }

  static runningState(state: StreamState): RunningStateLike {
    return new FakeRunningState(state)
  }

  static async delay(ms: number) {
    return new Promise<void>((resolve) => {
      setTimeout(() => resolve(), ms)
    })
  }

  static randomCID(): CID {
    const body = uint8arrays.concat([
      uint8arrays.fromString('1220', 'base16'),
      random.randomBytes(32),
    ])
    return CID.create(1, SHA256_CODE, decodeMultiHash(body))
  }

  /**
   * Modifies the given DID instance to simulate a key rotation
   * @param did
   * @param rotateDate
   */
  static rotateKey(did: DID, rotateDate: string) {
    did.resolve = async (didUrl) => {
      const { did } = parseDidUrl(didUrl)
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

    did.createJWS = async () => jwsForVersion1
  }

  /**
   * Undoes the effect of 'rotateKey' to the given DID instance
   * @param did
   */
  static resetDidToNotRotatedState(did: DID) {
    const keyDidResolver = KeyDidResolver.getResolver()
    did.setResolver({
      ...keyDidResolver,
      ...ThreeIdResolver,
    })

    did.createJWS = async () => jwsForVersion0
  }
}
