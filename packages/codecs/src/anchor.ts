import { type, string, number, sparse, optional, literal, union, type TypeOf } from 'codeco'
import { carAsUint8Array, cidAsString } from './ipld.js'
import { streamIdAsString } from './stream.js'
import { uint8ArrayAsBase64 } from './binary.js'
import { dateAsUnix } from './date.js'

export enum RequestStatusName {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  READY = 'READY',
  REPLACED = 'REPLACED',
}

/**
 * Part of CAS response that sends AnchorCommit content. Effectively a historical artefact.
 */
export const AnchorCommitPresentation = sparse(
  {
    content: optional(
      sparse(
        {
          path: optional(string),
          prev: string.pipe(cidAsString),
          proof: optional(string.pipe(cidAsString)),
        },
        'content'
      )
    ),
    cid: string.pipe(cidAsString),
  },
  'AnchorCommitPresentation'
)
export type AnchorCommitPresentation = TypeOf<typeof AnchorCommitPresentation>

export const NotCompleteStatusName = union([
  literal(RequestStatusName.PENDING),
  literal(RequestStatusName.PROCESSING),
  literal(RequestStatusName.FAILED),
  literal(RequestStatusName.READY),
  literal(RequestStatusName.REPLACED),
])
export type NotCompleteStatusName = TypeOf<typeof NotCompleteStatusName>

export const NotCompleteCASResponse = sparse(
  {
    id: string,
    status: NotCompleteStatusName,
    streamId: streamIdAsString,
    cid: cidAsString,
    message: string,
    createdAt: optional(number.pipe(dateAsUnix)),
    updatedAt: optional(number.pipe(dateAsUnix)),
  },
  'NotCompleteCASResponse'
)
export type NotCompleteCASResponse = TypeOf<typeof NotCompleteCASResponse>

export const CompleteCASResponse = sparse(
  {
    ...NotCompleteCASResponse.props,
    status: literal(RequestStatusName.COMPLETED),
    anchorCommit: AnchorCommitPresentation,
    witnessCar: optional(uint8ArrayAsBase64.pipe(carAsUint8Array)),
  },
  'CompleteCASResponse'
)
export type CompleteCASResponse = TypeOf<typeof CompleteCASResponse>

export const CASResponse = union([NotCompleteCASResponse, CompleteCASResponse], 'CASResponse')
export type CASResponse = TypeOf<typeof CASResponse>

export const ErrorResponse = type(
  {
    error: string,
  },
  'ErrorResponse'
)
export type ErrorResponse = TypeOf<typeof ErrorResponse>

export const CASResponseOrError = union([CASResponse, ErrorResponse], 'CASResponseOrError')
export type CASResponseOrError = TypeOf<typeof CASResponseOrError>
