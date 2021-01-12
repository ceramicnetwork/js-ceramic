import type CID from 'cids'
import { validateLink } from "3id-blockchain-utils"
import { Caip10LinkDoctype, Caip10LinkParams, DOCTYPE_NAME } from "@ceramicnetwork/doctype-caip10-link"
import {
    AnchorStatus,
    DocState,
    DoctypeConstructor,
    DoctypeHandler,
    DocOpts,
    SignatureStatus,
    RecordType,
    CeramicRecord,
    AnchorRecord,
    Context
} from "@ceramicnetwork/common"

export class Caip10LinkDoctypeHandler implements DoctypeHandler<Caip10LinkDoctype> {
    /**
     * Gets doctype name
     */
    get name(): string {
        return DOCTYPE_NAME
    }

    /**
     * Gets doctype class
     */
    get doctype(): DoctypeConstructor<Caip10LinkDoctype> {
        return Caip10LinkDoctype
    }

    /**
     * Creates Caip10Link instance
     * @param params - Create parameters
     * @param context - Ceramic context
     * @param opts - Initialization options
     */
    async create(params: Caip10LinkParams, context: Context, opts?: DocOpts): Promise<Caip10LinkDoctype> {
        return Caip10LinkDoctype.create(params, context, opts);
    }

    /**
     * Applies record (genesis|signed|anchor)
     * @param record - Record to be applied
     * @param cid - Record CID
     * @param context - Ceramic context
     * @param state - Document state
     */
    async applyRecord(record: CeramicRecord, cid: CID, context: Context, state?: DocState): Promise<DocState> {
        if (state == null) {
            return this._applyGenesis(record, cid)
        }

        if ((record as AnchorRecord).proof) {
            return this._applyAnchor(context, record, cid, state);
        }

        return this._applySigned(record, cid, state);
    }

    /**
     * Applies genesis record
     * @param record - Genesis record
     * @param cid - Genesis record CID
     * @private
     */
    async _applyGenesis (record: any, cid: CID): Promise<DocState> {
        // TODO - verify genesis record
        return {
            doctype: DOCTYPE_NAME,
            content: null,
            next: {
                content: null
            },
            metadata: record.header,
            signature: SignatureStatus.GENESIS,
            anchorStatus: AnchorStatus.NOT_REQUESTED,
            log: [{ cid, type: RecordType.GENESIS }]
        }
    }

    /**
     * Applies signed record
     * @param record - Signed record
     * @param cid - Signed record CID
     * @param state - Document state
     * @private
     */
    async _applySigned (record: any, cid: CID, state: DocState): Promise<DocState> {
        // TODO: Assert that the 'prev' of the record being applied is the end of the log in 'state'
        const validProof = await validateLink(record.data)
        if (!validProof) {
            throw new Error('Invalid proof for signed record')
        }

        if (state.signature !== SignatureStatus.GENESIS && (
          (
            state.anchorStatus === AnchorStatus.ANCHORED &&
            validProof.timestamp < state.anchorProof.blockTimestamp
          ) || (
            state.anchorStatus !== AnchorStatus.ANCHORED &&
            validProof.timestamp < state.next.metadata.lastUpdate
          )
        )) {
          throw new Error('Invalid record, proof timestamp too old')
        }

        // TODO: handle CAIP-10 addresses in proof generation of 3id-blockchain-utils
        const account = validProof.account || validProof.address
        let [address, chainId] = account.split('@')  // eslint-disable-line prefer-const

        const addressCaip10 = [address, chainId].join('@')
        if (addressCaip10.toLowerCase() !== state.metadata.controllers[0].toLowerCase()) {
            throw new Error("Address doesn't match document controller")
        }
        state.log.push({ cid, type: RecordType.SIGNED })
        return {
            ...state,
            signature: SignatureStatus.SIGNED,
            anchorStatus: AnchorStatus.NOT_REQUESTED,
            next: {
                content: validProof.did,
                metadata: {
                  ...state.metadata,
                  lastUpdate: validProof.timestamp // in case there are two updates after each other
                }
            }
        }
    }

    /**
     * Applies anchor record
     * @param context - Ceramic context
     * @param record - Anchor record
     * @param cid - Anchor record CID
     * @param state - Document state
     * @private
     */
    async _applyAnchor (context: Context, record: any, cid: CID, state: DocState): Promise<DocState> {
        // TODO: Assert that the 'prev' of the record being applied is the end of the log in 'state'
        const proof = (await context.ipfs.dag.get(record.proof)).value;

        const supportedChains = await context.api.getSupportedChains()
        if (!supportedChains.includes(proof.chainId)) {
            throw new Error("Anchor proof chainId '" + proof.chainId
                + "' is not supported. Supported chains are: '"
                + supportedChains.join("', '") + "'")
        }

        state.log.push({ cid, type: RecordType.ANCHOR })
        let content = state.content
        if (state.next?.content) {
            content = state.next.content
            delete state.next.content
            delete state.next.metadata
        }
        return {
            ...state,
            content,
            anchorStatus: AnchorStatus.ANCHORED,
            anchorProof: proof,
        }
    }

}
