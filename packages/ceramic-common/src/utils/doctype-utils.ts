import ajv from "ajv"
import CID from 'cids'
import cloneDeep from "lodash.clonedeep"
import { AnchorStatus, DocState, Doctype } from "../doctype"

/**
 * Doctype related utils
 */
export class DoctypeUtils {

    static validator: any = new ajv({ allErrors: true })

    /**
     * Create Doctype instance from the document wrapper
     * @param genesisCid - Genesis record CID
     * @param version - Doctype version
     */
    static createDocIdFromGenesis(genesisCid: any, version: any = null): string {
        const baseDocId = ['ceramic:/', genesisCid.toString()].join('/')
        return version? `${baseDocId}?version=${version.toString()}` : baseDocId
    }

    /**
     * Create Doctype instance from the document wrapper
     * @param docId - Doctype ID
     * @param version - Doctype version
     */
    static createDocIdFromBase(docId: string, version: any = null): string {
        return version? `${docId}?version=${version.toString()}` : docId
    }

    /**
     * Normalize document ID
     * @param docId - Document ID
     */
    static normalizeDocId(docId: string): string {
        if (docId.startsWith('ceramic://')) {
            return docId.replace('ceramic://', '/ceramic/')
        }
        return docId
    }

    /**
     * Normalize document ID
     * @param docId - Document ID
     */
    static getGenesis(docId: string): string {
        const genesis = (docId.startsWith('ceramic://')) ? docId.split('//')[1] : docId.split('/')[2]
        const indexOfVersion = genesis.indexOf('?')
        if (indexOfVersion !== -1) {
            return genesis.substring(0, indexOfVersion)
        }
        return genesis
    }

    /**
     * Normalize document ID
     * @param docId - Document ID
     */
    static getBaseDocId(docId: string): string {
        const indexOfVersion = docId.indexOf('?')
        if (indexOfVersion !== -1) {
            return docId.substring(0, indexOfVersion)
        }
        return docId
    }

    /**
     * Normalize document ID
     * @param docId - Document ID
     */
    static getVersionId(docId: string): CID {
        const genesis = (docId.startsWith('ceramic://')) ? docId.split('//')[1] : docId.split('/')[2]
        const indexOfVersion = genesis.indexOf('?')
        if (indexOfVersion !== -1) {
            const params = DoctypeUtils._getQueryParam(genesis.substring(indexOfVersion + 1))
            return params['version']? new CID(params['version']) : null
        }
        return null
    }

    /**
     * Get query params from document ID
     * @param query - Document query
     * @private
     */
    static _getQueryParam(query: string): Record<string, string> {
        const result: Record<string, string> = {};
        if (!query) {
            return result
        }

        const pairs = query.toLowerCase().split('&')
        pairs.forEach(function(pair) {
            const mapping: string[] = pair.split('=');
            result[mapping[0]] = mapping[1] || '';
        });
        return result
    }

    /**
     * Serializes doctype state for over the network transfer
     * @param state - Doctype state
     */
    static serializeState(state: any): any {
        const cloned = cloneDeep(state)

        cloned.log = cloned.log.map((cid: any) => cid.toString());
        if (cloned.anchorStatus) {
            cloned.anchorStatus = AnchorStatus[cloned.anchorStatus];
        }
        if (cloned.anchorScheduledFor) {
            cloned.anchorScheduledFor = new Date(cloned.anchorScheduledFor).toISOString(); // ISO format of the UTC time
        }
        if (cloned.anchorProof) {
            cloned.anchorProof.txHash = cloned.anchorProof.txHash.toString();
            cloned.anchorProof.root = cloned.anchorProof.root.toString();
        }
        return cloned
    }

    /**
     * Deserializes doctype cloned from over the network transfer
     * @param state - Doctype cloned
     */
    static deserializeState(state: any): DocState {
        const cloned = cloneDeep(state)

        cloned.log = cloned.log.map((cidStr: string): CID => new CID(cidStr))
        if (cloned.anchorProof) {
            cloned.anchorProof.txHash = new CID(cloned.anchorProof.txHash);
            cloned.anchorProof.root = new CID(cloned.anchorProof.root);
        }

        let showScheduledFor = true;
        if (cloned.anchorStatus) {
            cloned.anchorStatus = AnchorStatus[cloned.anchorStatus];
            showScheduledFor = cloned.anchorStatus !== AnchorStatus.FAILED && cloned.anchorStatus !== AnchorStatus.ANCHORED
        }
        if (cloned.anchorScheduledFor) {
            if (showScheduledFor) {
                cloned.anchorScheduledFor = Date.parse(cloned.anchorScheduledFor); // ISO format of the UTC time
            } else {
                cloned.anchorScheduledFor = null;
            }
        }
        return cloned
    }

    /**
     * Make doctype readonly
     * @param doctype - Doctype instance
     */
    static makeReadOnly<T extends Doctype>(doctype: T): T {
        const cloned = cloneDeep(doctype)
        cloned.change = (): Promise<void> => {
            throw new Error('The version of the document is readonly. Checkout the latest HEAD in order to update.')
        }
        return cloned
    }

    /**
     * Validates model against JSON-Schema
     * @param doctype - Doctype instance
     */
    static validate<T extends Doctype>(doctype: T): boolean {
        if (!doctype.schema) {
            return true
        }

        const isValid = this.validator.validate(doctype.schema, doctype.content)

        if (!isValid) {
            const errorMessages = this.validator.errorsText()
            throw new Error(`Validation Error. ${errorMessages}`)
        }

        return isValid
    }
}
