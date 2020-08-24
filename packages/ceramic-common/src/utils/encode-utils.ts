import CID from 'cids'
import isCircular from 'is-circular'

export class EncodeUtils {

  /**
   * Encode payload before signing
   * @param obj - Payload
   *
   * TODO remove after introducing dag-jose
   */
  static encodeDagJson(obj: Record<string, any>): Record<string, any> {
    if (isCircular(obj)) {
      throw new Error('Object contains circular references.')
    }

    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (CID.isCID(value)) {
        acc[key] = { '/': value.toString() }
      } else if (Buffer.isBuffer(value)) {
        acc[key] = { '/': { base64: value.toString('base64') } }
      } else if (typeof value === 'object' && value !== null) {
        acc[key] = EncodeUtils.encodeDagJson(value)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        acc[key] = value
      }
      return acc
    }, {} as Record<string, any>)
  }
}
