'use strict'
const fs = jest.genMockFromModule<any>('fs')
fs.promises = jest.requireActual('fs').promises

interface MockFile {
    name: string;
    birthtime: Date;
    message: string;
    size: number;
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
            message: '',
            size: 0
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

function writeFile(filePath: string, data: any, options: { flag: string }): Promise<void> {
    const prevFile = mockFs[filePath] || {
        name: filePath,
        birthtime: new Date(),
        message: '',
        size: 0
    }

    if (options.flag === 'w') {
        mockFs[filePath] = {
            ...prevFile,
            message: data
        }
    } else if (options.flag === 'a') {
        mockFs[filePath] = {
            ...prevFile,
            message: prevFile.message.concat(data)
        }
    }
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
fs.promises.writeFile = writeFile

module.exports = fs
