import { CID } from 'multiformats/cid'
import { type Context, Type } from 'codeco'
import { CAR, CARFactory } from 'cartonne'
import * as DAG_JOSE from 'dag-jose'

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

const carFactory = new CARFactory()
carFactory.codecs.add(DAG_JOSE)

/**
 * codeco codec for CAR file encoded as a Uint8Array.
 */
export const carAsUint8Array = new Type<CAR, Uint8Array, Uint8Array>(
  'CAR-as-uint8array',
  (input: unknown): input is CAR => {
    return input != null && input instanceof CAR
  },
  (input: Uint8Array, context: Context) => {
    try {
      return context.success(carFactory.fromBytes(input))
    } catch {
      return context.failure()
    }
  },
  (car) => car.bytes
)
