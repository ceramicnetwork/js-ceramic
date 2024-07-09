/**
 * Environment related utils, that is information about the mode and system we're operating in.
 */
export class EnvironmentUtils {
  /**
   * Returns whether or not we're running using rust-ceramic
   */
  static useRustCeramic(): boolean {
    return process.env.IPFS_FLAVOR !== 'go'
  }

  /**
   * Changes the server from expecting rust or go ipfs to the other
   */
  static setIpfsFlavor(flavor: 'go' | 'rust') {
    process.env.IPFS_FLAVOR = flavor
  }
}
