import * as path from 'path'
import fs from 'fs'
import { Utils } from '../../utils.js'

describe('Utils schema validation', () => {
  const schemaDefDirPath = path.join(import.meta.url, '__schemas__')
  const testDirsPath = path.join(import.meta.url, '__data__')
  const testDirs = fs.readdirSync(testDirsPath)

  testDirs.forEach((testDir) => {
    const schemaFilePath = path.join(schemaDefDirPath, `${testDir}.json`)
    const schema = JSON.parse(fs.readFileSync(schemaFilePath, 'utf-8'))
    const testFilePath = path.join(testDirsPath, testDir)

    const tests = fs.readdirSync(testFilePath)
    tests.forEach((test) => {
      switch (test) {
        case 'valid.json':
          it(`should pass ${testDir} schema validation for ${test}`, () => {
            const content = JSON.parse(fs.readFileSync(path.join(testFilePath, test), 'utf-8'))
            Utils.validate(content, schema)
          })
          break
        case 'invalid.json':
          it(`should fail ${testDir} schema validation for ${test}`, () => {
            const content = JSON.parse(fs.readFileSync(path.join(testFilePath, test), 'utf-8'))
            try {
              Utils.validate(content, schema)
              throw new Error('Should not be able to validate invalid data')
            } catch (e) {
              expect(e.message).toContain('Validation Error')
            }
          })
          break
        default:
          throw new Error(`Invalid test ${test}`)
      }
    })
  })
})
