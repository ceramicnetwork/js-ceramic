import { AccountId } from 'caip'

export function normalizeAccountId(accountId: string | AccountId): AccountId {
  if (typeof accountId === 'string' && accountId.includes('@')) {
    const [address, chainId] = accountId.split('@')
    if (!address || !chainId) {
      throw new Error(`Invalid accountId provided`)
    }

    return new AccountId({ address, chainId })
  }
  return new AccountId(accountId)
}
