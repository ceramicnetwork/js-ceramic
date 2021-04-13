import { BlockedFiles, LogToFiles } from '../ceramic-logger-plugins'

jest.mock('fs')
import fs from 'fs'

describe('Ceramic Logger Plugins', () => {
    jest.setTimeout(20000)

    let dateNowSpy: any

    const yesterday = new Date('2020-10-30')
    const today = new Date('2020-10-31')
    const inconclusive = new Date(0)

    const YESTERDAY = 0
    const TODAY = 1
    const LARGE = 2
    const INCONCLUSIVE = 3
    const BLOCKING = 4

    describe('LogToFiles', () => {
        let mockFiles: Array<any>
        let mockFs: any
        let blockedFiles: BlockedFiles
        let basePath: string

        beforeEach(async () => {
            basePath = '/usr/local/var/log/'
            mockFiles = [
                {
                    name: `${basePath}yesterday.log`,
                    message: 'yesterday\n',
                    birthtime: yesterday,
                    size: 10000000, // 10MB
                    __blocking: false
                },
                {
                    name: `${basePath}today.log`,
                    message: 'today\n',
                    birthtime: today,
                    size: 9000000, // 9 MB
                    __blocking: false
                },
                {
                    name: `${basePath}large.log`,
                    message: 'large\n',
                    birthtime: today,
                    size: 133000000, // 133MB
                    __blocking: false
                },
                {
                    name: `${basePath}inconclusive.log`,
                    message: 'inconclusive\n',
                    birthtime: inconclusive,
                    size: 0,
                    __blocking: false
                },
                {
                    name: `${basePath}blocking.log`,
                    message: 'blocking\n',
                    birthtime: today,
                    size: 1000000, // 1MB
                    __blocking: true
                }
            ]
            // @ts-ignore
            fs.__initMockFs(mockFiles)
            // @ts-ignore
            mockFs = fs.__getMockFs()
            blockedFiles = {}
        })
        afterEach(() => {
            if (dateNowSpy) dateNowSpy.mockRestore()
        })

        describe('_write', () => {
            it('should append message to file that does not need rotating', async () => {
                dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => today.getTime())
                const filePath = mockFiles[1].name
                const prevMessage = mockFiles[1].message

                const message = 'message'
                await LogToFiles['_write'](blockedFiles, basePath, 'today', message)
                const nextFilePath = filePath + '.old'

                expect(mockFs[filePath].message).toBe(prevMessage + message + '\n')
                expect(mockFs[nextFilePath]).toBeUndefined()
            })
            it('should rotate files of at least max size before appending', async () => {
                dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => today.getTime())
                const prevFilePath = mockFiles[LARGE].name
                const prevFileMessage = mockFiles[LARGE].message

                const nextFileMessage = 'nextmessage'
                await LogToFiles['_write'](blockedFiles, basePath, 'large', nextFileMessage)
                const nextFilePath = prevFilePath + '.old'

                expect(mockFs[prevFilePath].message).toBe(nextFileMessage + '\n')
                expect(mockFs[nextFilePath].message).toBe(prevFileMessage)
            })
            it('should rotate expired files before appending', async () => {
                dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => today.getTime())
                const prevFilePath = mockFiles[YESTERDAY].name
                const prevFileMessage = mockFiles[YESTERDAY].message

                const nextFileMessage = 'nextmessage'
                await LogToFiles['_write'](blockedFiles, basePath, 'yesterday', nextFileMessage)
                const nextFilePath = prevFilePath + '.old'

                expect(mockFs[prevFilePath].message).toBe(nextFileMessage + '\n')
                expect(mockFs[nextFilePath].message).toBe(prevFileMessage)
            })
            it('should not rotate file with inconclusive birthtime', async () => {
                dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => today.getTime())
                const prevFilePath = mockFiles[INCONCLUSIVE].name
                const prevFileMessage = mockFiles[INCONCLUSIVE].message

                const nextFileMessage = 'message'
                await LogToFiles['_write'](blockedFiles, basePath, 'inconclusive', nextFileMessage)
                const nextFilePath = prevFilePath + '.old'

                expect(mockFs[prevFilePath].message).toBe(prevFileMessage + nextFileMessage + '\n')
                expect(mockFs[nextFilePath]).toBeUndefined()
            })
            it('should not append the message if the file is already being written to', async () => {
                dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => today.getTime())
                const filePath = mockFiles[TODAY].name
                const prevMessage = mockFiles[TODAY].message
                const message1 = 'message1'
                const message2 = 'message2'
                LogToFiles['_writeBlockedWarning'] = jest.fn()
                jest.useFakeTimers();
                LogToFiles['_write'](blockedFiles, basePath, 'today', message1)
                LogToFiles['_write'](blockedFiles, basePath, 'today', message2)
                setTimeout(() => {
                    expect(LogToFiles['_writeBlockedWarning']).toHaveBeenCalledTimes(1)
                    expect(mockFs[filePath].message).toBe(prevMessage + message1 + '\n')
                }, 1500);
            })
            it('should not append the message if a stream for the file needs draining', async () => {
                dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => today.getTime())
                const filePath = mockFiles[BLOCKING].name
                const prevMessage = mockFiles[BLOCKING].message
                const message1 = 'message1'
                const message2 = 'message2'
                LogToFiles['_writeBlockedWarning'] = jest.fn()
                await LogToFiles['_write'](blockedFiles, basePath, 'blocking', message1)
                await LogToFiles['_write'](blockedFiles, basePath, 'blocking', message2)
                expect(LogToFiles['_writeBlockedWarning']).toHaveBeenCalledTimes(2)
                expect(mockFs[filePath].message).toBe(prevMessage + message1 + '\n')
            })
        }) 

        describe('_writeStreamId', () => {
            it('should write the streamId if the doc key is present', async () => {
                const filePath = basePath + 'today-streamids.log'
                const message = {doc: 'kz123'}
                await LogToFiles['_writeStreamId'](blockedFiles, basePath, 'today', message)
                expect(mockFs[filePath].message).toBe(message.doc + '\n')
            })
            it('should not write the streamId if the doc key is not present', async () => {
                const filePath = basePath + 'today-streamids.log'
                const message = {nope: 'kz123'}
                await LogToFiles['_writeStreamId'](blockedFiles, basePath, 'today', message)
                expect(mockFs[filePath]).toBe(undefined)
            })
            it('should not write if the file is already being written to', async () => {
                const filePath = basePath + 'today-streamids.log'
                const message1 = {doc: '1'}
                const message2 = {doc: '2'}
                LogToFiles['_writeBlockedWarning'] = jest.fn()
                jest.useFakeTimers();
                LogToFiles['_writeStreamId'](blockedFiles, basePath, 'today', message1)
                LogToFiles['_writeStreamId'](blockedFiles, basePath, 'today', message2)
                setTimeout(() => {
                    expect(LogToFiles['_writeBlockedWarning']).toHaveBeenCalledTimes(1)
                    expect(mockFs[filePath].message).toBe(message1.doc + '\n')
                }, 1500);
            })
            it('should overwrite the existing file when writing', async () => {
                const filePath = basePath + 'today-streamids.log'
                const message1 = {doc: 1, something: '1', foo: /$/}
                const message2 = {doc: 2, something: '2', foo: /$/}
                LogToFiles['_writeBlockedWarning'] = jest.fn()
                // jest.useFakeTimers();
                await LogToFiles['_writeStreamId'](blockedFiles, basePath, 'today', message1)
                expect(mockFs[filePath].message).toBe(message1.doc + '\n')
                await LogToFiles['_writeStreamId'](blockedFiles, basePath, 'today', message2)
                expect(mockFs[filePath].message).toBe(message2.doc + '\n')
            })
        })
    })
})
