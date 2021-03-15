import {DocState, Doctype} from "../doctype";

export class TestUtils {

    /**
     * Returns a Promise that resolves when there is an update to the given document's state.
     * @param doc
     */
    static registerChangeListener(doc: Doctype): Promise<void> {
        return new Promise(resolve => {
            doc.once('change', () => {
                resolve()
            })
        })
    }

    /**
     * Given a document and a predicate that operates on the document state, continuously waits for
     * changes to the document until the predicate returns true.
     * @param doc
     * @param timeout - how long to wait for
     * @param predicate - function that takes the document's DocState as input and returns true when this function can stop waiting
     * @param onFailure - function called if we time out before the predicate becomes true
     */
    static async waitForState(doc: Doctype,
                              timeout: number,
                              predicate: (state: DocState) => boolean,
                              onFailure: () => void): Promise<void> {
        const timeoutPromise = new Promise(resolve => setTimeout(resolve, timeout))
        const completionPromise = new Promise<void>(resolve => {
            const handler = () => {
                if (predicate(doc.state)) {
                    doc.off('change', handler)
                    resolve()
                }
            }
            doc.on('change', handler)

            // Call handler() manually once to see if the predicate was already true
            // before the handler was registered as a doc listener.
            handler()
        })
        await Promise.race([timeoutPromise, completionPromise])
        if (!predicate(doc.state)) {
            onFailure()
        }
    }
}
