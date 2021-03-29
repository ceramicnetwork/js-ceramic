import { AuthProvider } from "./auth-provider";
import { EthereumAuthProvider } from "./ethereum";
import * as ethereum from "./ethereum";
import { AccountID } from "caip";
import { LinkProof } from "./util";

// ChainId = 43114 for mainnet
// ChainId = 43113 for fuji testnet

/**
 *  AuthProvider which can be used for Ethereum providers with standard interface.
 * 
 * ChainId = 43114 for mainnet
 * ChainId = 43113 for fuji testnet
 */
export class AvalancheAuthProvider extends EthereumAuthProvider implements AuthProvider {

}

export function isEthAddress(address: string): boolean {
  return ethereum.isEthAddress(address);
}

export async function isERC1271(
  account: AccountID,
  provider: any
): Promise<boolean> {
  return ethereum.isERC1271(account, provider);
}

export async function createLink(
  did: string,
  account: AccountID,
  provider: any,
  opts: any
): Promise<LinkProof> {
  return ethereum.createLink(did, account, provider, opts);
}

export async function authenticate(
  message: string,
  account: AccountID,
  provider: any
): Promise<string> {
  return ethereum.authenticate(message, account, provider);
}
