import { test, expect } from '@jest/globals'
import { Model } from '../model.js'

test('Model.MODEL', () => {
  expect(Model.MODEL.bytes).toMatchSnapshot()
  expect(Model.MODEL.toString()).toMatchSnapshot()
})
