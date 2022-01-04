import fs from 'node:fs'
import { Utils } from '../../utils.js'

describe('Utils schema validation', () => {
  const schemaDefDirPath = new URL('./__schemas__/', import.meta.url)
  const testDirsPath = new URL('./__data__/', import.meta.url)
  const testDirs = fs.readdirSync(testDirsPath)

  testDirs.forEach((testDir) => {
    const schemaFilePath = new URL(`./${testDir}.json`, schemaDefDirPath)
    const schema = JSON.parse(fs.readFileSync(schemaFilePath, 'utf-8'))
    const testFilePath = new URL(`./${testDir}/`, testDirsPath)

    const tests = fs.readdirSync(testFilePath)
    tests.forEach((test) => {
      const jsonPath = new URL(test, testFilePath)
      const content = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
      switch (test) {
        case 'valid.json':
          it(`should pass ${testDir} schema validation for ${test}`, () => {
            Utils.validate(content, schema)
          })
          break
        case 'invalid.json':
          it(`should fail ${testDir} schema validation for ${test}`, () => {
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
