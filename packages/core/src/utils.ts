import ajv from "ajv"

import { Doctype } from "@ceramicnetwork/common"

/**
 * Various utility functions
 */
export default class Utils {

    static validator: any = new ajv({ allErrors: true })

    /**
     * Awaits on condition for certain amount of time
     */
    // eslint-disable-next-line @typescript-eslint/ban-types
    static async awaitCondition(conditionFn: Function, stopFunction: Function, awaitInterval: number): Promise<void> {
        while (conditionFn()) {
            if (stopFunction()) {
                return
            }
            await new Promise(resolve => setTimeout(resolve, awaitInterval))
        }
    }

    /**
     * Validates model against JSON-Schema
     * @param schema - Doctype schema
     */
    static isSchemaValid(schema: Record<string, unknown>): boolean {
        Utils.validator.compile(schema) // throws an error on invalid schema
        return Utils.validator.validateSchema(schema) // call validate schema just in case
    }

    /**
     * Validates model against JSON-Schema
     * @param content - Doctype content
     * @param schema - Doctype schema
     */
    static validate(content: any, schema: any): void {
        const isValid = Utils.validator.validate(schema, content)
        if (!isValid) {
            const errorMessages = Utils.validator.errorsText()
            throw new Error(`Validation Error: ${errorMessages}`)
        }
    }

    /**
     * Validate Doctype against schema
     */
    static async validateDoctype(doctype: Doctype): Promise<void> {
        const schemaDocId = doctype.state?.metadata?.schema
        if (schemaDocId) {
            const schemaDoc = await doctype.context.api.loadDocument(schemaDocId)
            if (!schemaDoc) {
                throw new Error(`Schema not found for ${schemaDocId}`)
            }
            Utils.validate(doctype.content, schemaDoc.content)
        }
    }

}

export class TrieNode {
    public key: string
    public children:  Record<string, TrieNode>
  
    constructor(key = '') {
      this.key = key
      this.children = {}
    }
}
  
export class PathTrie {
    public root: TrieNode

    constructor() {
        this.root = new TrieNode()
    }

    add(path: string) {
        const nextNodeAdd = (node: TrieNode, key: string): TrieNode => {
        if (!node.children[key]) node.children[key] = new TrieNode(key)
            return node.children[key]
        }
        if (path.startsWith('/')) path = path.substring(1)
        path.split('/').reduce(nextNodeAdd, this.root)
    }
}

export const promiseTimeout = (ms: number, promise:Promise<any>): Promise<any> => {
    const timeout = new Promise((resolve, reject) => {
        setTimeout(() => reject(), ms)
    })
    return Promise.race([timeout, promise])
}