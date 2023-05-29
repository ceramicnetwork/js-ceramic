import { CID } from 'multiformats/cid'
import { type Context, Type } from 'codeco'

/**
 * Passthrough codeco codec for CID.
 */
export const cid = new Type<CID, CID, unknown>(
  'CID',
  (input: unknown): input is CID => {
    try {
      return !!CID.asCID(input)
    } catch (e) {
      return false
    }
  },
  (input: unknown, context: Context) => {
    try {
      const cid = CID.asCID(input)
      if (!cid) return context.failure(`Value ${cid} can not be accepted as CID`)
      return context.success(cid)
    } catch {
      return context.failure()
    }
  },
  (cid) => cid
)

/**
 * codeco codec for CID encoded as string.
 */
export const cidAsString = new Type<CID, string, string>(
  'CID-as-string',
  (input: unknown): input is CID => {
    try {
      return !!CID.asCID(input)
    } catch (e) {
      return false
    }
  },
  (input: string, context: Context) => {
    try {
      const cid = CID.parse(input)
      return context.success(cid)
    } catch {
      return context.failure()
    }
  },
  (cid) => cid.toString()
)
