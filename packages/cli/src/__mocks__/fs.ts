'use strict'
const fs = jest.genMockFromModule<any>('fs')
fs.promises = jest.requireActual('fs').promises

interface MockFile {
    name: string;
    birthtime: Date;
    message: string;
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

    write(message: string): void {
        const prevFile = mockFs[this.filePath] || {
            name: this.filePath,
            birthtime: new Date(),
            message: ''
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
    }

    end(): void {
        // pass
    }
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
    return mockFs[filePath]
}

fs.__initMockFs = __initMockFs
fs.__getMockFs = __getMockFs
fs.createWriteStream = createWriteStream
fs.promises.rename = rename
fs.promises.stat = stat

module.exports = fs
