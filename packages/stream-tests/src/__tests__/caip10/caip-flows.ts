import { AuthProvider } from '@ceramicnetwork/blockchain-utils-linking'
import { toLegacyAccountId } from '@ceramicnetwork/common'
import { Caip10Link } from '@ceramicnetwork/stream-caip10-link'
import { AccountId } from 'caip'
import { Ceramic } from '@ceramicnetwork/core'

export async function happyPath(ceramic: Ceramic, authProvider: AuthProvider) {
  if (!ceramic.did) throw new Error(`No ceramic.did present`)
  const accountId = await authProvider.accountId()
  const caip = await Caip10Link.fromAccount(ceramic, accountId)
  await caip.setDid(ceramic.did, authProvider)
  expect(caip.state.log.length).toEqual(2)
  expect(caip.did).toEqual(ceramic.did.id)
}

export async function wrongProof(
  ceramic: Ceramic,
  authProvider: AuthProvider,
  wrongAccountId?: AccountId
) {
  const signingAccountId = await authProvider.accountId()
  if (!wrongAccountId) {
    wrongAccountId = await authProvider.accountId()
    wrongAccountId.address = 'wrong-test-user'
  }

  const legacySigningAccountId = toLegacyAccountId(signingAccountId.toString()).toLowerCase()
  const legacyLinkAccountId = toLegacyAccountId(wrongAccountId.toString()).toLowerCase()

  const caip = await Caip10Link.fromAccount(ceramic, wrongAccountId)
  if (!ceramic.did) throw new Error(`No ceramic.did present`)
  await expect(caip.setDid(ceramic.did, authProvider)).rejects.toThrow(
    `Address '${legacySigningAccountId}' used to sign update to Caip10Link doesn't match stream controller '${legacyLinkAccountId}'`
  )
}

export async function clearDid(ceramic: Ceramic, authProvider: AuthProvider) {
  const accountId = await authProvider.accountId()
  const caip = await Caip10Link.fromAccount(ceramic, accountId)

  const didStr = 'did:test::%122323:awe.23-1_a:23'
  await caip.setDid(didStr, authProvider)
  await expect(caip.did).toEqual(didStr)

  await caip.clearDid(authProvider)
  await expect(caip.did).toBeNull()
}
