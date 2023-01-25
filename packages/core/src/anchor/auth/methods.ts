import {
    AnchorServiceAuthMethods,
} from '@ceramicnetwork/common'
import { DIDAnchorServiceAuth } from './anchor/auth/did-anchor-service-auth.js'

export const AnchorServiceAuthMethodClasses = {
  [AnchorServiceAuthMethods.DID]: DIDAnchorServiceAuth,
}
