'use strict'
const fs = jest.genMockFromModule<any>('fs')
fs.promises = jest.requireActual('fs').promises

interface MockFile {
    name: string;
    birthtime: Date;
    message: string;
    size: number;
    __blocking: boolean;
}

interface MockFs {
    [filePath: string]: MockFile;
}

let mockFs: MockFs = {}

class MockStream {
    filePath: string
    writeFlag: string

    constructor(filePath: string, writeFlag: string) {
        this.filePath = filePath
        this.writeFlag = writeFlag
    }
    on(event: string, cb: any): void { /* eslint-disable-line */ }

    write(message: string): boolean {
        const prevFile = mockFs[this.filePath] || {
            name: this.filePath,
            birthtime: new Date(),
            message: '',
            size: 0,
            __blocking: false
        }

        if (this.writeFlag === 'w') {
            mockFs[this.filePath] = {
                ...prevFile,
                message
            }
        } else if (this.writeFlag === 'a') {
            mockFs[this.filePath] = {
                ...prevFile,
                message: prevFile.message.concat(message)
            }
        }
        if (mockFs[this.filePath].__blocking) return false // Can not write again
        return true
    }

    end(): void { /* eslint-disable-line */ }
}

function __initMockFs(files: Array<MockFile>): void {
    mockFs = {}
    files.forEach((file) => {
        mockFs[file.name] = file
    })
}

function __getMockFs(): MockFs {
    return mockFs
}

function createWriteStream(filePath: string, options: { flags: string }): MockStream {
    return new MockStream(filePath, options.flags)
}

async function rename(filePath: string, nextFilePath: string): Promise<void> {
    const file = mockFs[filePath]
    delete mockFs[filePath]
    mockFs[nextFilePath] = file
}

async function stat(filePath: string): Promise<MockFile> {
    return Promise.resolve(mockFs[filePath])
}

fs.__initMockFs = __initMockFs
fs.__getMockFs = __getMockFs
fs.createWriteStream = createWriteStream
fs.promises.rename = rename
fs.promises.stat = stat

module.exports = fs
