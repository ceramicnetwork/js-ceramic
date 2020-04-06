declare module '3id-blockchain-utils' {
  export function createLink(did: any, address: any, provider: any, opts?: object): object;
  export function validateLink(proof: { type: string }, did?: any): { address: string; did: string } | null;
}
