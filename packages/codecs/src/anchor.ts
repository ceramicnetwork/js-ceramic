import { type, string, sparse, optional, literal, union, type TypeOf } from 'codeco'
import { carAsUint8Array, cidAsString } from './ipld.js'
import { streamIdAsString } from './stream.js'
import { uint8ArrayAsBase64 } from './binary.js'

export enum RequestStatusName {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  READY = 'READY',
  REPLACED = 'REPLACED',
}

export const CommitPresentation = sparse(
  {
    content: optional(
      sparse({ path: optional(string), prev: string, proof: optional(string) }, 'content')
    ),
    cid: string.pipe(cidAsString),
  },
  'CommitPresentation'
)
export type CommitPresentation = TypeOf<typeof CommitPresentation>

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
    status: NotCompleteStatusName,
    streamId: streamIdAsString,
    cid: cidAsString,
    message: string,
  },
  'NotCompleteCASResponse'
)
export type NotCompleteCASResponse = TypeOf<typeof NotCompleteCASResponse>

export const CompleteCASResponse = type(
  {
    ...NotCompleteCASResponse.props,
    status: literal(RequestStatusName.COMPLETED),
    anchorCommit: CommitPresentation,
    witnessCar: uint8ArrayAsBase64.pipe(carAsUint8Array),
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
