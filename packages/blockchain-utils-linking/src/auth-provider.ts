import { LinkProof } from './util'
import { AccountId } from 'caip'

/**
 *  AuthProvider defines the interface your custom authProvider must
 *  must implement. The properties network, id, name, image are all required.
 *
 *  AuthProvider is expected to handle just one address.
 *  One could use `#withAddress` to instantiate AuthProvider with another address.
 */
export interface AuthProvider {
  readonly isAuthProvider: true

  /**
   *  (Required) Authenticate function consumes both a message (human readable string) and
   *  accountId (often a hex address). It is strictly required that for any
   *  given set of {message, accountId} this function deterministically returns
   *  a unique 32 - 64 byte hex string of entropy. This will allow this external account
   *  to continue to access 3ID in the future and for it be added as an auth method.
   *
   *  For most implementations this will be signing the message with an
   *  account/wallet from your blockchain account provider and returning a fixed length
   *  string of the signature by hashing it. This function does not need to consume
   *  accountId/address if your provider knows that value at later point of the interaction.
   *  But should still map to a unique output for any given message and accountId pair.
   *
   *  For your given network/blockchain you should be able to find an authenticate
   *  function in https://github.com/ceramicnetwork/js-3id-blockchain-utils, if you
   *  are using the standard account signing interface in your network/blockchain.
   *  If you are using a standard interface and it doesn't exist in js-3id-blockchain-utils,
   *  please open an issue there, so we can add shared support for your network.
   *
   * @param message   A human readable string
   * @return          A 32-64 bytes hex string
   */
  authenticate(message: string): Promise<string>

  /**
   *  (Required) createLink will publish a public verifiable link between account
   *  used to authenticate and the users 3ID. To implement this you need to import
   *  createLink from https://github.com/ceramicnetwork/js-3id-blockchain-utils and
   *  pass the link type. You must have support for your blockchain in
   *  js-3id-blockchain-utils to add here. As other libraries need to be able to
   *  verify and consume these links.
   *
   * @param did       A human readable string
   * @return          Returns on success
   */
  createLink(did: string): Promise<LinkProof>

  /**
   * Return currently used address as CAIP AccountID.
   */
  accountId(): Promise<AccountId>

  /**
   * Instantiate a new AuthProvider using a new address.
   * @param address
   */
  withAddress(address: string): AuthProvider
}
