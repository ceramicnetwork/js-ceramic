import { fromString, toString } from 'uint8arrays'

export function base64urlToJSON(s: string): Record<string, any> {
  return JSON.parse(toString(fromString(s, 'base64url'))) as Record<string, any>
}

export function JSONToBase64Url(json: any): string {
  return toString(fromString(JSON.stringify(json)), 'base64url')
}
