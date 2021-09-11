<<<<<<< HEAD
export * from "./auth-provider";
export * as ethereum from "./ethereum";
export * from "./util";
export * as filecoin from "./filecoin";
export * as polkadot from "./polkadot";
export * as eosio from "./eosio";
export * as cosmos from "./cosmos";
export { NearAuthProvider } from "./near";
=======
export * from './auth-provider'
export * as ethereum from './ethereum'
export * from './util'
export * as filecoin from './filecoin'
export * as polkadot from './polkadot'
export * as eosio from './eosio'
export * as cosmos from './cosmos'
export * as tezos from './tezos'

export { EthereumAuthProvider } from './ethereum'
export { EthereumAuthProvider as AvalancheAuthProvider } from './ethereum'
export { FilecoinAuthProvider } from './filecoin'
export { EosioAuthProvider } from './eosio'
export { PolkadotAuthProvider } from './polkadot'
export { CosmosAuthProvider } from './cosmos'
export { NearAuthProvider } from './near'
export { TezosAuthProvider, TezosProvider } from './tezos'
>>>>>>> 4267d8b31fca38a163bb009198a49e1de22b2a58
