declare module '3id-blockchain-utils' {
  export function createLink(did: any, address: any, provider: any, opts?: Record<string, any>): Record<string, unknown>;
  export function validateLink(proof: { type: string }, did?: any): { address: string; did: string } | null;
}
