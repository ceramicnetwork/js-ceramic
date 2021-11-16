// NOTE: This differs from `normalizeAccountId` in `stream-caip10-link`
// This converts from CAIP-10 repr to the legacy repr
// The former converts from legacy to the current repr
export function normalizeAccountId(accountId: string): string {
  if (!accountId.includes('@')) {
    const _accountSplit = accountId.split(':')
    const address = _accountSplit.pop()
    const chainId = _accountSplit.join(':')
    return `${address}@${chainId}`
  }
  return accountId
}
