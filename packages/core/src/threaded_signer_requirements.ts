import type { DID } from '@ceramicnetwork/common'
import {
  DEFAULT_VERIFIERS,
  CreateJWSOptions,
  DagJWS,
  DagJWSResult,
  UnderlyingCeramicSigner,
  VerifyJWSOptions,
  VerifyJWSResult,
} from '@ceramicnetwork/common'
import { DidVerifier, ThreadedDid } from 'dids-threads'

class ThreadedSignerRequirements implements UnderlyingCeramicSigner {
  private _threadedDid?: ThreadedDid
  private _verifier?: DidVerifier

  static async fromDid(did: DID): Promise<ThreadedSignerRequirements> {
    const reqs = new ThreadedSignerRequirements()
    await reqs.init()
    await reqs.withDid(did)
    return reqs
  }

  public async init() {
    this._verifier = new DidVerifier()
    await this._verifier.init()
  }

  public async withDid(did: DID) {
    this._threadedDid = await this._verifier.addDid(did, DEFAULT_VERIFIERS)
  }

  async ensureAuthenticated(): Promise<void> {
    if (!this._threadedDid.authenticated) {
      await this._threadedDid.authenticate()
    }
  }

  createJWS<T extends string | Record<string, any>>(
    payload: T,
    options?: CreateJWSOptions
  ): Promise<DagJWS> {
    return this._threadedDid.createJWS(payload, options)
  }

  createDagJWS(payload: Record<string, any>, options?: CreateJWSOptions): Promise<DagJWSResult> {
    return this._threadedDid.createDagJWS(payload, options)
  }

  verifyJWS(jws: string | DagJWS, options?: VerifyJWSOptions): Promise<VerifyJWSResult> {
    return this._threadedDid.verifyJWS(jws, options)
  }

  asController(): Promise<string> {
    return this._threadedDid.hasParent ? this._threadedDid.parent : this._threadedDid.id
  }

  get did(): DID {
    return this._threadedDid.did
  }
}
