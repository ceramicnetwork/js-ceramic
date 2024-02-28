import {
  DEFAULT_VERIFIERS,
  CreateJWSOptions,
  DagJWS,
  DagJWSResult,
  UnderlyingCeramicSigner,
  VerifyJWSOptions,
  VerifyJWSResult,
  CeramicSigner,
} from '@ceramicnetwork/common'
import type { DID } from 'dids-threads'
import { DidVerifier, ThreadedDid } from 'dids-threads'

export class ThreadedUnderlyingSigner implements UnderlyingCeramicSigner {
  private _threadedDid?: ThreadedDid
  private _verifier: DidVerifier

  private constructor(verifier: DidVerifier) {
    this._verifier = verifier
  }

  static invalid(verifier: DidVerifier): ThreadedUnderlyingSigner {
    return new ThreadedUnderlyingSigner(verifier)
  }

  ensureDid(): void {
    if (!this._threadedDid) {
      throw new Error('No DID')
    }
  }

  async ensureAuthenticated(): Promise<void> {
    this.ensureDid()
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
    this.ensureDid()
    return this._threadedDid.verifyJWS(jws, options)
  }

  asController(): Promise<string> {
    return this._threadedDid.hasParent ? this._threadedDid.parent : this._threadedDid.id
  }

  withDid(did: DID): void {
    this._threadedDid = this._verifier.addDid(did, DEFAULT_VERIFIERS)
  }

  get did(): DID {
    this.ensureDid()
    return this._threadedDid.did
  }
}

export class ThreadedCeramicSigner {
  static invalid(verifier: DidVerifier): CeramicSigner {
    const reqs = ThreadedUnderlyingSigner.invalid(verifier)
    return new CeramicSigner(reqs)
  }
}
