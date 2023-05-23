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

/**
 * codeco codec for CAR file encoded as a Uint8Array.
 */
// TODO(2820): Make this codec work
// export const carAsUint8Array = new Type<CAR, Uint8Array, Uint8Array>(
//   'CAR-as-uint8array',
//   (input: unknown): input is CAR => {
//     try {
//       return true // TODO: what do I do here?!?!
//     } catch (e) {
//       return false
//     }
//   },
//   (input: Uint8Array, context: Context) => {
//     try {
//       // TODO Do I need to create a carFactory every time?
//       return null
//     } catch {
//       return context.failure()
//     }
//   },
//   (car) => car.bytes
// )
