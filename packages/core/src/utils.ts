import ajv from "ajv"

import { AnchorService, Context, Doctype } from "@ceramicnetwork/common"

import { DEFAULT_ANCHOR_SERVICE_CHAIN_ID } from "./ceramic"
import { IN_MEMORY_ANCHOR_SERVICE_CHAIN_ID } from "./anchor/memory/in-memory-anchor-service"

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

    /**
     * Gets the default anchoring service.
     *
     * The default service anchors on Ropsten. If it's not specified, return the in-memory one.
     *
     * Note: only the first anchor service is returned from the list. If there are multiple services for the same
     * chainId we should re-think about priorities.
     */
    static getAnchorService(context: Context, chainId?: string): AnchorService {
        const anchorServices = context.anchorServices[chainId ? chainId : DEFAULT_ANCHOR_SERVICE_CHAIN_ID]
        return anchorServices != null ? anchorServices[0] : context.anchorServices[IN_MEMORY_ANCHOR_SERVICE_CHAIN_ID][0]
    }
}
