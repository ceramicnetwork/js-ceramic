# Add support for new blockchain

This document contains a guide on how to add support for a new blockchain to the [`caip10-link`](https://github.com/ceramicnetwork/CIP/blob/master/CIPs/CIP-7/CIP-7.md) doctype, as well as use for authentication.

## Overview: Ceramic and blockchain accounts

Ceramic interacts with blockchain accounts in two ways:
- authentication,
- linking.

*Authentication.* 3ID Connect (using `3id-did-provider`) create `3id` (Ceramic flavour of DID) private keys
based on an externally-provided entropy. It could be provided by a blockchain account by merely
signing a well-known message. From a user's standpoint,
it is authentication _into_ Ceramic through her blockchain account, be it on Ethereum, Filecoin,
EOS, Cosmos or something else. Same signature (=same entropy) generates same Ceramic DID.

*Linking.* In addition to generating DID a user could also _link_ additional blockchain accounts to Ceramic DID.
It establishes a relation `blockchain account → DID` that allows one to discover DID along with social profile
based on just a blockchain account. Additionally, a link serves as a proof-of-ownership by DID over the blockchain account.
This has proven to be useful fir dApp personalization: one sees familiar names instead of `0xgibberish`.

Below one additional process is mentioned: validation. It checks if _proof-of-ownership_ in the link is formally correct,
i.e., a well-known payload is really signed by the account that is declared in the link.

## Adding a new blockchain

To add a new blockchain one have to do both linking and validation sections. 

### Linking

We use [CAIP-10](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-10.md) to represent accounts in a blockchain agnostic way.
If the blockchain you want to add isn't already part of the CAIP standards you should make sure to add it there.

To add a new blockchain, one has to implement a new class implementing [AuthProvider](https://github.com/ceramicnetwork/js-ceramic/blob/develop/packages/blockchain-utils-linking/src/auth-provider.ts), put it
into [`@ceramicnetwork/blockchain-utils-linking`](https://github.com/ceramicnetwork/js-ceramic/tree/develop/packages/blockchain-utils-linking) package and export it.
See existing auth providers for inspiration.

Auth provider is expected to be mainly called in a web browser as part of [3id-connect](https://github.com/3box/3id-connect) flow.
Auth provider sits between 3id-connect (or 3ID DID Provider) and your blockchain account provider. In case of Ethereum,
it might be MetaMask. Auth provider is responsible mainly for:
- authentication (`#authenticate`): provide entropy,
- creating link (`#createLink`): create a LinkProof object which associates the specified AccountID with the DID.

Auth provider is expected to know which blockchain account it currently serves. It reports it via `#accountId`.
To reuse same internal settings, e.g. connection to blockchain provider, but with a different account,
auth provider should have `#withAddress` method.

To sum it all up, to add a new blockchain for linking:
- add new class implementing `AuthProvider` interface to `@ceramicnetwork/blockchain-utils-linking` package,
- its `authenticate` method should ask blockchain provider for an authentication signature and return 32 bytes
  in form of `0x`-prefixed hex string,
- its `createLink` method should ask blockchain provider for linking signature and return `LinkProof` data structure,
- its `accountId` method should return currently used account in CAIP-10 format,
- its `withAccount` method should return a new instance of auth provider that serves a new account.

### Validation

It is a counterpart of [#linking] that checks if signature contained in `LinkProof` corresponds to declared account.

To add a new blockchain:
- add a new file named after your blockchain to `@ceramicnetwork/blockchain-utils-validation` package,
- this file should expose `BlockchainHandler` structure, having:
    - CAIP-10 namespace for your blockchain,
    - `validateLink` function: it checks if linking signature was created by an account declared in `LinkProof` argument,
- add the newly created `BlockchainHandler` to `handlers` list in [index.ts](https://github.com/ceramicnetwork/js-ceramic/blob/develop/packages/blockchain-utils-validation/src/index.ts).

Make sure that `validateLink` could validate links created by `AuthProvider#createLink`.
