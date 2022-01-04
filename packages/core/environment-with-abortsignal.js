// my-custom-environment
import NodeEnvironment from 'jest-environment-node'

export default class EnvironmentWithAbortSignal extends NodeEnvironment {
  constructor(config) {
    super(config)
  }

  async setup() {
    await super.setup()
    // eslint-disable-next-line no-undef
    this.global.AbortSignal = AbortSignal
  }

  async teardown() {
    await super.teardown()
  }

  getVmContext() {
    return super.getVmContext()
  }
}
