import { fromString, toString } from 'uint8arrays'

export function base64urlToJSON(s: string): Record<string, any> {
  return JSON.parse(toString(fromString(s, 'base64url'))) as Record<string, any>
}
