import { test, describe } from '@jest/globals'

test.todo('plain GET request')
describe('POST request', () => {
  // add json header
  // stringify content
  test.todo('json')
  // do not add header
  test.todo('not json, no headers')
  // add header
  test.todo('not json, custom header')
})
test.todo('respect timeout')
test.todo('respect abort signal')
test.todo('throw when not ok')
