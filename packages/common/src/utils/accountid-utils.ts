import { AccountId } from 'caip'

// Converts a legacy CAIP10 accountId representation to the stable CAIP10 representation
export function normalizeAccountId(accountId: string | AccountId): AccountId {
  // Handle legacy CAIP-10 representation
  if (typeof accountId === 'string' && accountId.includes('@')) {
    const [address, chainId] = accountId.split('@')
    if (!address || !chainId) {
      throw new Error(`Invalid accountId provided`)
    }

    return new AccountId({ address, chainId })
  }
  return new AccountId(accountId)
}

// Converts a CAIP10 representation to the legacy CAIP10 representation for accountId
export function toLegacyAccountId(accountId: string): string {
  if (!accountId.includes('@')) {
    const _accountSplit = accountId.split(':')
    const address = _accountSplit.pop()
    const chainId = _accountSplit.join(':')
    return `${address}@${chainId}`
  }
  return accountId
}
