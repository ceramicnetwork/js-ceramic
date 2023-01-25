import {
    AnchorServiceAuthMethods,
} from '@ceramicnetwork/common'
import { DIDAnchorServiceAuth } from './did-anchor-service-auth.js'

export const AnchorServiceAuthMethodClasses = {
  [AnchorServiceAuthMethods.DID]: DIDAnchorServiceAuth,
}
