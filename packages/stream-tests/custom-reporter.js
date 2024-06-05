class CustomReporter {
  constructor(globalConfig, reporterOptions, reporterContext) {
    this._globalConfig = globalConfig
    this._options = reporterOptions
    this._context = reporterContext
  }

  /**
   * Called when test starts by 'test' or 'it'.
   */
  onTestCaseStart(test, testCaseStartInfo) {
    const cwd = test.context.config.cwd + '/'
    const at = test.path.replace(cwd, '')
    console.log(`Jest-Custom: Starting test case "${testCaseStartInfo.fullName}" at ${at}`)
  }

  /**
   * Called when test started by 'test' or 'it' finishes.
   */
  onTestCaseResult(test, testCaseResult) {
    const cwd = test.context.config.cwd + '/'
    const at = test.path.replace(cwd, '')
    console.log(`Jest-Custom: Finished test case "${testCaseResult.fullName}" at ${at}`)
  }
}

module.exports = CustomReporter
