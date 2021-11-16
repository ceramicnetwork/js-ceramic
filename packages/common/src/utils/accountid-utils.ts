import { AccountId } from 'caip'

// Converts a legacy CAIP10 accountId repr to the stable CAIP10 repr
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

// Converts a CAIP10 repr to the legacy CAIP10 repr for accountId
export function legacizeAccountId(accountId: string): string {
  if (!accountId.includes('@')) {
    const _accountSplit = accountId.split(':')
    const address = _accountSplit.pop()
    const chainId = _accountSplit.join(':')
    return `${address}@${chainId}`
  }
  return accountId
}
