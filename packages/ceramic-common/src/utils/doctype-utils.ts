import ajv from "ajv"
import CID from 'cids'
import cloneDeep from "lodash.clonedeep"
import * as u8a from 'uint8arrays'

import { Ipfs } from "ipfs"
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
     * Serializes record
     * @param record - Record instance
     */
    static serializeRecord(record: any): any {
        const cloned = cloneDeep(record)

        if (DoctypeUtils.isSignedRecordDTO(cloned)) {
            cloned.jws.link = cloned.jws.link.toString()
            cloned.linkedBlock = u8a.toString(cloned.linkedBlock, 'base64')
            return cloned
        }

        if (DoctypeUtils.isSignedRecord(cloned)) {
            cloned.link = cloned.link.toString()
        }

        if (DoctypeUtils.isAnchorRecord(cloned)) {
            cloned.proof = cloned.proof.toString()
        }

        if (cloned.id) {
            cloned.id = cloned.id.toString()
        }

        if (cloned.prev) {
            cloned.prev = cloned.prev.toString()
        }
        return cloned
    }

    /**
     * Deserializes record
     * @param record - Record instance
     */
    static deserializeRecord(record: any): any {
        const cloned = cloneDeep(record)

        if (DoctypeUtils.isSignedRecordDTO(cloned)) {
            cloned.jws.link = new CID(cloned.jws.link)
            cloned.linkedBlock = u8a.fromString(cloned.linkedBlock, 'base64')
            return cloned
        }

        if (DoctypeUtils.isSignedRecord(cloned)) {
            cloned.link = new CID(cloned.link)
        }

        if (DoctypeUtils.isAnchorRecord(cloned)) {
            cloned.proof = new CID(cloned.proof)
        }

        if (cloned.id) {
            cloned.id = new CID(cloned.id)
        }

        if (cloned.prev) {
            cloned.prev = new CID(cloned.prev)
        }
        return cloned
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
            cloned.anchorScheduledFor = new Date(cloned.anchorScheduledFor).toLocaleString()
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
        doctype.change = (): Promise<void> => {
            throw new Error('The version of the document is readonly. Checkout the latest HEAD in order to update.')
        }
        return doctype
    }

    /**
     * Validates model against JSON-Schema
     * @param schema - Doctype schema
     */
    static isSchemaValid(schema: object): boolean {
        this.validator.compile(schema) // throws an error on invalid schema
        return this.validator.validateSchema(schema) // call validate schema just in case
    }

    /**
     * Validates model against JSON-Schema
     * @param content - Doctype content
     * @param schema - Doctype schema
     */
    static validate(content: any, schema: any): void {
        const isValid = this.validator.validate(schema, content)
        if (!isValid) {
            const errorMessages = this.validator.errorsText()
            throw new Error(`Validation Error: ${errorMessages}`)
        }
    }

    /**
     * Converts record to DTO. The only difference is with signed record for now
     * @param record - Record value
     * @param ipfs - IPFS instance
     */
    static async convertRecordToDTO(record: any, ipfs: Ipfs): Promise<any> {
        if (DoctypeUtils.isSignedRecord(record)) {
            let linkedBlock = await ipfs.block.get(record.link)
            if (linkedBlock.data instanceof Buffer) {
                // transform Buffer into Uint8Array
                linkedBlock = new Uint8Array(linkedBlock.data.buffer)
            }
            return {
                jws: record,
                linkedBlock,
            }
        }
        return record
    }

    /**
     * Checks if record is signed DTO ({jws: {}, linkedBlock: {}})
     * @param record - Record
     */
    static isSignedRecordDTO(record: any): boolean {
        return typeof record === 'object' && 'jws' in record && 'linkedBlock' in record
    }

    /**
     * Checks if record is signed
     * @param record - Record
     */
    static isSignedRecord(record: any): boolean {
        return typeof record === 'object' && 'link' in record && 'payload' in record && 'signatures' in record
    }

    /**
     * Checks if record is anchor record
     * @param record - Record
     */
    static isAnchorRecord(record: any): boolean {
        return typeof record === 'object' && 'proof' in record && 'path' in record
    }
}
