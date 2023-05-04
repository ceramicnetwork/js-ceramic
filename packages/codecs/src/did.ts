import { refinement, string } from 'codeco'

import type { Opaque } from './types.js'

export type DIDString = Opaque<string, 'DIDString'>

const PCT_ENCODED = '(?:%[0-9a-fA-F]{2})'
const ID_CHAR = `(?:[a-zA-Z0-9._-]|${PCT_ENCODED})`
const METHOD = '([a-z0-9]+)'
const METHOD_ID = `((?:${ID_CHAR}*:)*(${ID_CHAR}+))`
const DID_MATCHER = new RegExp(`^did:${METHOD}:${METHOD_ID}$`)

/**
 * Verify if `input` is DID string, i.e. conforms to `did:method:id` format.
 */
export function isDIDString(input: string): input is DIDString {
  return Boolean(input && input.match(DID_MATCHER))
}

/**
 * Type cast `input` as `DIDString`.
 */
export function asDIDString(input: string): DIDString {
  return input as DIDString
}

/**
 * codeco codec for a vanilla DID string, i.e. `did:method:id`.
 */
export const didString = refinement(string, isDIDString, 'did-string')
