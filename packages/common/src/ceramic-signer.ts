import {
  CreateJWSOptions,
  DagJWS,
  DagJWSResult,
  DID,
  VerifyJWSOptions,
  VerifyJWSResult,
} from 'dids'

export {
  CreateJWSOptions,
  DagJWS,
  DagJWSResult,
  DIDResolutionResult,
  VerifyJWSOptions,
  VerifyJWSResult,
} from 'dids'

/**
 * Interface for an object that can sign ceramic commits
 */
export interface UnderlyingCeramicSigner {
  ensureAuthenticated(): Promise<void>
  createJWS<T extends string | Record<string, any>>(
    payload: T,
    options?: CreateJWSOptions
  ): Promise<DagJWS>
  createDagJWS(payload: Record<string, any>, options?: CreateJWSOptions): Promise<DagJWSResult>
  verifyJWS(jws: string | DagJWS, options?: VerifyJWSOptions): Promise<VerifyJWSResult>
  asController(): Promise<string>
  withDid(did: DID): void
  did: DID
}

class DidUnderlyingCeramicSigner implements UnderlyingCeramicSigner {
  private _did?: DID

  constructor(did?: DID) {
    this._did = did
  }

  ensureDid(): void {
    if (!this._did) {
      throw new Error('No DID')
    }
  }

  async ensureAuthenticated(): Promise<void> {
    this.ensureDid()
    if (!this._did.authenticated) {
      await this._did.authenticate()
    }
  }
  createJWS<T extends string | Record<string, any>>(
    payload: T,
    options?: CreateJWSOptions
  ): Promise<DagJWS> {
    return this._did.createJWS(payload, options)
  }
  createDagJWS(payload: Record<string, any>, options?: CreateJWSOptions): Promise<DagJWSResult> {
    return this._did.createDagJWS(payload, options)
  }
  verifyJWS(jws: string | DagJWS, options?: VerifyJWSOptions): Promise<VerifyJWSResult> {
    this.ensureDid()
    return this._did.verifyJWS(jws, options)
  }
  async asController(): Promise<string> {
    return this._did.hasParent ? this._did.parent : this._did.id
  }
  withDid(did: DID): void {
    this._did = did
  }
  get did(): DID {
    this.ensureDid()
    return this._did
  }
}

export interface IntoSigner {
  signer: CeramicSigner
}

export class CeramicSigner implements IntoSigner {
  private isAuthenticated: boolean
  private reqs: UnderlyingCeramicSigner

  constructor(reqs: UnderlyingCeramicSigner) {
    this.isAuthenticated = false
    this.reqs = reqs
  }

  get did(): DID {
    return this.reqs.did
  }

  get signer(): CeramicSigner {
    return this
  }

  static invalid(): CeramicSigner {
    return new CeramicSigner(new DidUnderlyingCeramicSigner())
  }

  static fromDID(did: DID): CeramicSigner {
    const signer = new CeramicSigner(new DidUnderlyingCeramicSigner())
    signer.withDid(did)
    return signer
  }

  public withDid(did: DID): void {
    this.reqs.withDid(did)
  }

  async createJWS<T extends string | Record<string, any>>(
    payload: T,
    options?: CreateJWSOptions
  ): Promise<DagJWS> {
    if (!this.isAuthenticated) {
      await this.reqs.ensureAuthenticated()
      this.isAuthenticated = true
    }
    return this.reqs.createJWS(payload, options)
  }

  async createDagJWS(
    payload: Record<string, any>,
    options?: CreateJWSOptions
  ): Promise<DagJWSResult> {
    if (!this.isAuthenticated) {
      await this.reqs.ensureAuthenticated()
      this.isAuthenticated = true
    }
    return this.reqs.createDagJWS(payload, options)
  }

  async asController(): Promise<string> {
    if (!this.isAuthenticated) {
      await this.reqs.ensureAuthenticated()
      this.isAuthenticated = true
    }
    return this.reqs.asController()
  }

  async verifyJWS(jws: string | DagJWS, options?: VerifyJWSOptions): Promise<VerifyJWSResult> {
    return this.reqs.verifyJWS(jws, options)
  }
}
