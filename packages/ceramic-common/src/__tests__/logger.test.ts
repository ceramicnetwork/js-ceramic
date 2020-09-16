import { LoggerFactory } from ".."

describe('Doctype', () => {
    it('should log text', async () => {
        const log: Logger = LoggerFactory.getLogger('testLogger')
        log.warn("test")
    })

})
