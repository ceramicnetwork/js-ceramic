const toMB = (bytes) => Math.floor(bytes / 1024 / 1024)

function heapUsedClause() {
  return `(${toMB(process.memoryUsage().heapUsed)} MB heap used)`
}

class CustomReporter {
  constructor(globalConfig, reporterOptions, reporterContext) {
    this._globalConfig = globalConfig
    this._options = reporterOptions
    this._context = reporterContext
  }

  onTestFileStart(test) {
    console.debug('Jest-Custom: Starting test file', test.path, heapUsedClause())
  }

  onTestFileResult(test) {
    console.debug('Jest-Custom: Finished test file', test.path, heapUsedClause())
  }

  /**
   * Called when test starts by 'test' or 'it'.
   */
  onTestCaseStart(test, testCaseStartInfo) {
    const cwd = test.context.config.cwd + '/'
    const at = test.path.replace(cwd, '')
    console.log(
      `Jest-Custom: Starting test case "${testCaseStartInfo.fullName}" at ${at}`,
      heapUsedClause()
    )
  }

  /**
   * Called when test started by 'test' or 'it' finishes.
   */
  onTestCaseResult(test, testCaseResult) {
    const cwd = test.context.config.cwd + '/'
    const at = test.path.replace(cwd, '')
    console.log(
      `Jest-Custom: Finished test case "${testCaseResult.fullName}" at ${at}`,
      heapUsedClause()
    )
  }
}

module.exports = CustomReporter
