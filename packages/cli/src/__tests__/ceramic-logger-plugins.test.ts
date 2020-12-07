import { LogToFiles } from '../ceramic-logger-plugins'

jest.mock('fs')
import fs from 'fs'

describe('Ceramic Logger Plugins', () => {
    jest.setTimeout(20000)

    let dateNowSpy: any

    const yesterday = new Date('2020-10-30')
    const today = new Date('2020-10-31')

    describe('LogToFiles', () => {
        let mockFiles: Array<any>
        let mockFs: any

        beforeEach(async () => {
            mockFiles = [
                {
                    name: '/usr/var/log/ceramic/yesterday.log',
                    message: 'yesterday\n',
                    birthtime: yesterday
                },
                {
                    name: '/usr/var/log/ceramic/today.log',
                    message: 'today\n',
                    birthtime: today
                }
            ]
            // @ts-ignore
            fs.__initMockFs(mockFiles)
            // @ts-ignore
            mockFs = fs.__getMockFs()
        })
        afterEach(() => {
            dateNowSpy.mockRestore()
        })

        describe('_isExpired', () => {
            it('returns true if amount of time since file was created > expiration time', async () => {
                dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => today.getTime())
                const isExpired = await LogToFiles['_isExpired'](mockFiles[0].name)
                expect(dateNowSpy).toHaveBeenCalled()
                expect(isExpired).toBe(true)
            })
            it('returns false if amount of time since file was created <= expiration time', async () => {
                dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => today.getTime())
                const isExpired = await LogToFiles['_isExpired'](mockFiles[1].name)
                expect(dateNowSpy).toHaveBeenCalled()
                expect(isExpired).toBe(false)
            })
        })

        describe('_writeStream', () => {
            it('should rotate expired files before overwriting', async () => {
                dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => today.getTime())
                const prevFilePath = mockFiles[0].name
                const prevFileMessage = mockFiles[0].message

                const isExpired = await LogToFiles['_isExpired'](prevFilePath)
                expect(isExpired).toBe(true)

                const nextFileMessage = 'nextmessage'
                await LogToFiles['_writeStream'](prevFilePath, nextFileMessage, 'w')
                const nextFilePath = prevFilePath + '.old'

                expect(mockFs[prevFilePath].message).toBe(nextFileMessage + '\n')
                expect(mockFs[nextFilePath].message).toBe(prevFileMessage)
            })
            it('should rotate expired files before appending', async () => {
                dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => today.getTime())
                const prevFilePath = mockFiles[0].name
                const prevFileMessage = mockFiles[0].message

                const isExpired = await LogToFiles['_isExpired'](prevFilePath)
                expect(isExpired).toBe(true)

                const nextFileMessage = 'nextmessage'
                await LogToFiles['_writeStream'](prevFilePath, nextFileMessage, 'a')
                const nextFilePath = prevFilePath + '.old'

                expect(mockFs[prevFilePath].message).toBe(nextFileMessage + '\n')
                expect(mockFs[nextFilePath].message).toBe(prevFileMessage)
            })
            it('should append the message to an unexpired file without rotating', async () => {
                dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => today.getTime())
                const filePath = mockFiles[1].name
                const prevMessage = mockFiles[1].message

                const isExpired = await LogToFiles['_isExpired'](filePath)
                expect(isExpired).toBe(false)

                const message = 'message'
                await LogToFiles['_writeStream'](filePath, message, 'a')
                const nextFilePath = filePath + '.old'

                expect(mockFs[filePath].message).toBe(prevMessage + message + '\n')
                expect(mockFs[nextFilePath]).toBeUndefined()
            })
            it('should overwrite an unexpired file without rotating', async () => {
                dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => today.getTime())
                const filePath = mockFiles[1].name

                const isExpired = await LogToFiles['_isExpired'](filePath)
                expect(isExpired).toBe(false)

                const message = 'message'
                await LogToFiles['_writeStream'](filePath, message, 'w')
                const nextFilePath = filePath + '.old'

                expect(mockFs[filePath].message).toBe(message + '\n')
                expect(mockFs[nextFilePath]).toBeUndefined()
            })
        })
    })
})
