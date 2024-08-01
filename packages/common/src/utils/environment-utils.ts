// use a file local instead of setting environment variables from node
let IPFS_FLAVOR = process.env.IPFS_FLAVOR || 'rust'
/**
 * Environment related utils, that is information about the mode and system we're operating in.
 */
export class EnvironmentUtils {
  /**
   * Returns whether or not we're running using rust-ceramic
   */
  static useRustCeramic(): boolean {
    switch (IPFS_FLAVOR) {
      case 'go':
        return false
      default:
        return true
    }
  }

  /**
   * Changes the server from expecting rust or go ipfs to the other
   */
  static setIpfsFlavor(flavor: 'go' | 'rust') {
    IPFS_FLAVOR = flavor
  }
}
