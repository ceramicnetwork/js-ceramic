declare module '3id-blockchain-utils' {
  export function createLink(did: any, address: any, provider: any, opts?: object): object;
  export function validateLink(proof: any, did?: any): object | null;
}
