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
  did: DID
}

export interface IntoSigner {
  signer: CeramicSigner
}

export class CeramicSigner implements IntoSigner {
  private isAuthenticated: boolean
  private reqs?: UnderlyingCeramicSigner

  constructor(reqs?: UnderlyingCeramicSigner) {
    this.isAuthenticated = false
    this.reqs = reqs
  }

  get did(): DID | undefined {
    return this.reqs?.did
  }

  get signer(): CeramicSigner {
    return this
  }

  static invalid(): CeramicSigner {
    return new CeramicSigner()
  }

  static fromDID(did: DID): CeramicSigner {
    const signer = new CeramicSigner()
    signer.withDid(did)
    return signer
  }

  public withDid(did: DID) {
    this.reqs = {
      createDagJWS: (payload, options) => did.createDagJWS(payload, options),
      createJWS: (payload, options) => did.createJWS(payload, options),
      verifyJWS: (payload, options) => did.verifyJWS(payload, options),
      async ensureAuthenticated(): Promise<void> {
        if (!did.authenticated) {
          await did.authenticate()
        }
      },
      async asController(): Promise<string> {
        return did.hasParent ? did.parent : did.id
      },
      get did(): DID { return did }
    }
  }

  private assertRequirements(): Promise<void> {
    if (!this.reqs) {
      return Promise.reject('Requirements not met for signing. Was a DID set?')
    }
  }

  async createJWS<T extends string | Record<string, any>>(
    payload: T,
    options?: CreateJWSOptions
  ): Promise<DagJWS> {
    await this.assertRequirements()
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
    await this.assertRequirements()
    if (!this.isAuthenticated) {
      await this.reqs.ensureAuthenticated()
      this.isAuthenticated = true
    }
    return this.reqs.createDagJWS(payload, options)
  }

  async asController(): Promise<string> {
    await this.assertRequirements()
    if (!this.isAuthenticated) {
      await this.reqs.ensureAuthenticated()
      this.isAuthenticated = true
    }
    return this.reqs.asController()
  }

  async verifyJWS(jws: string | DagJWS, options?: VerifyJWSOptions): Promise<VerifyJWSResult> {
    await this.assertRequirements()
    return this.reqs.verifyJWS(jws, options)
  }
}
