/**
 * Various utility functions
 */
export default class Utils {

    /**
     * Awaits on condition for certain amount of time
     */
    static async awaitCondition(conditionFn: Function, stopFunction: Function, awaitInterval: number): Promise<void> {
        while (conditionFn()) {
            if (stopFunction()) {
                return
            }
            await new Promise(resolve => setTimeout(resolve, awaitInterval))
        }
    }

}
