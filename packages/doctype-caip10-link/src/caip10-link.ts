import {
    CeramicApi,
    CreateOpts,
    Stream,
    StreamConstructor,
    StreamStatic,
    SyncOptions,
    LoadOpts,
    UpdateOpts,
    UnsignedCommit,
    GenesisCommit,
} from '@ceramicnetwork/common';
import { AuthProvider, LinkProof } from "@ceramicnetwork/blockchain-utils-linking";
import { CommitID, StreamID, StreamRef } from "@ceramicnetwork/streamid";
import { AccountID } from "caip";
import { DID } from "dids";

const throwReadOnlyError = (): Promise<void> => {
    throw new Error('Historical stream commits cannot be modified. Load the stream without specifying a commit to make updates.')
}

const DEFAULT_CREATE_OPTS = { anchor: false, publish: true, sync: SyncOptions.PREFER_CACHE }
const DEFAULT_UPDATE_OPTS = { anchor: true, publish: true }
const DEFAULT_LOAD_OPTS = { sync: SyncOptions.PREFER_CACHE }

/**
 * Caip10Link doctype implementation
 */
@StreamStatic<StreamConstructor<Caip10Link>>()
export class Caip10Link extends Stream {

    static STREAM_TYPE_NAME = 'caip10-link'
    static STREAM_TYPE_ID = 1

    /**
     * Returns the DID linked to the CAIP10 address this object represents.
     */
    get did(): string | null {
        return this._getContent()
    }

    /**
     * Creates a Caip10Link for the given CAIP10 address. Initially created without a link to any DID,
     *   use 'setDid' to create the public link between the given CAIP10 account and a DID.
     * @param ceramic - Instance of CeramicAPI used to communicate with the Ceramic network
     * @param accountId - Blockchain account id in CAIP10 format.
     * @param opts - Additional options.
     */
    static async fromAccount(ceramic: CeramicApi,
                             accountId: string | AccountID,
                             opts: CreateOpts = {}): Promise<Caip10Link> {
        opts = { ...DEFAULT_CREATE_OPTS, ...opts };
        const normalizedAccountId = new AccountID(accountId)
        const genesisCommit = Caip10Link.makeGenesis(normalizedAccountId)
        return Caip10Link.fromGenesis(ceramic, genesisCommit, opts)
    }

    /**
     * Create Caip10Link from the genesis commit
     * @param ceramic - Instance of CeramicAPI used to communicate with the Ceramic network
     * @param genesisCommit - Genesis commit (first commit in stream log)
     * @param opts - Additional options
     */
    static async fromGenesis(ceramic: CeramicApi,
                             genesisCommit: GenesisCommit,
                             opts: CreateOpts = {}): Promise<Caip10Link> {
        opts = { ...DEFAULT_CREATE_OPTS, ...opts };
        return ceramic.createStreamFromGenesis<Caip10Link>(
            Caip10Link.STREAM_TYPE_ID, genesisCommit, opts)
    }

    /**
     * Given a DID and an AuthProvider which includes support for the CAIP2 chainid of
     * the CAIP10 address that this Caip10Link represents, updates this Caip10Link to
     * create a verifiable link from the CAIP10 address to the DID.
     * @param did - The DID being linked to the CAIP10 address that this Caip10Link object represents.
     *   If the 'did' provided is an instance of the DID type, the DID must already be authenticated
     *   so that the did string it represents is avapilable.
     * @param authProvider - AuthProvider instance from the "@ceramicnetwork/blockchain-utils-linking" package.
     *   Must include support for the blockchain that the CAIP10 address associated with this Caip10Link lives on.
     * @param opts - Additional options
     */
    async setDid(did: string | DID, authProvider: AuthProvider, opts: UpdateOpts = {}): Promise<void> {
        opts = { ...DEFAULT_UPDATE_OPTS, ...opts };
        const didStr: string = typeof did == "string" ? did : did.id
        const linkProof = await authProvider.createLink(didStr)
        return this.setDidProof(linkProof, opts)
    }

    /**
     * Given a LinkProof proving the relationship between a DID and a CAIP10 account,
     * updates this CAIP10Link to contain the proof, thereby making the link from the
     * CAIP10 address to the DID publicly discoverable.
     * @param proof - LinkProof as generated by the "@ceramicnetwork/blockchain-utils-linking" package
     * @param opts - Additional options
     */
    async setDidProof(proof: LinkProof, opts: UpdateOpts = {}): Promise<void> {
        opts = { ...DEFAULT_UPDATE_OPTS, ...opts };
        const commit = this.makeCommit(proof)
        const updated = await this.api.applyCommit(this.id, commit, opts)
        this.state$.next(updated.state);
    }

    /**
     * Loads a Caip10Link from a given StreamID
     * @param ceramic - Instance of CeramicAPI used to communicate with the Ceramic network
     * @param streamId - StreamID to load.  Must correspond to a Caip10Link doctype
     * @param opts - Additional options
     */
    static async load(ceramic: CeramicApi, streamId: StreamID | CommitID | string, opts: LoadOpts = {}): Promise<Caip10Link> {
        opts = { ...DEFAULT_LOAD_OPTS, ...opts };
        const streamRef = StreamRef.from(streamId)
        if (streamRef.type != Caip10Link.STREAM_TYPE_ID) {
            throw new Error(`StreamID ${streamRef.toString()} does not refer to a '${Caip10Link.STREAM_TYPE_NAME}' doctype, but to a ${streamRef.typeName}`)
        }

        return ceramic.loadStream<Caip10Link>(streamRef, opts)
    }

    /**
     * Makes the genesis commit from a given CAIP-10 AccountID
     * @param accountId
     */
    static makeGenesis(accountId: AccountID): GenesisCommit {
        return { header: { controllers: [accountId.toString()],
                           family: `caip10-${accountId.chainId.toString()}` } }

    }

    /**
     * Makes the commit to update linked CAIP10 account from a given LinkProof
     * @param proof
     */
    makeCommit(proof: LinkProof): UnsignedCommit {
        return { data: proof, prev: this.tip, id: this.state$.id.cid }
    }

    /**
     * Makes this stream read-only. After this has been called any future attempts to call
     * mutation methods on the instance will throw.
     */
    makeReadOnly() {
        this.setDidProof = throwReadOnlyError
        this.setDid = throwReadOnlyError
    }

}
