import { AuthProvider } from '@ceramicnetwork/blockchain-utils-linking'
import { CeramicApi } from '@ceramicnetwork/common'
import { Caip10Link } from '@ceramicnetwork/stream-caip10-link'
import type { AccountID } from 'caip'

export async function happyPath(ceramic: CeramicApi, authProvider: AuthProvider) {
  const accountId = await authProvider.accountId()
  const caip = await Caip10Link.fromAccount(ceramic, accountId)
  await caip.setDid(ceramic.did, authProvider)
  expect(caip.state.log.length).toEqual(2)
  expect(caip.did).toEqual(ceramic.did.id)
}

export async function wrongProof(ceramic: CeramicApi, authProvider: AuthProvider) {
  const accountId = await authProvider.accountId()
  accountId.address = 'wrong-test-user'
  const caip = await Caip10Link.fromAccount(ceramic, accountId)
  await expect(caip.setDid(ceramic.did, authProvider)).rejects.toThrow(
    /Address doesn't match stream controller/
  )
}

export async function clearDid(ceramic: CeramicApi, authProvider: AuthProvider) {
  const accountId = await authProvider.accountId()
  const caip = await Caip10Link.fromAccount(ceramic, accountId)

  const didStr = 'did:test::%122323:awe.23-1_a:23'
  await caip.setDid(didStr, authProvider)
  await expect(caip.did).toEqual(didStr)

  await caip.clearDid(authProvider)
  await expect(caip.did).toBeNull()
}
