import { type, string, sparse, optional, literal, union, type TypeOf } from 'codeco'
import { date } from './date.js'
import { enumCodec } from './enum.js'
import { cidAsString } from './ipld.js'
import { streamIdAsString } from './stream.js'

export enum RequestStatusName {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  READY = 'READY',
  REPLACED = 'REPLACED',
}

export const CommitPresentation = type(
  {
    content: sparse({ path: optional(string), prev: string, proof: optional(string) }, 'content'),
    cid: string,
  },
  'CommitPresentation'
)
export type CommitPresentation = TypeOf<typeof CommitPresentation>

export const NotCompleteCASResponse = type(
  {
    createdAt: date,
    streamId: streamIdAsString,
    id: string,
    message: string,
    status: enumCodec('RequestStatusName', RequestStatusName),
    cid: cidAsString,
    updatedAt: date,
  },
  'NotCompleteCASResponse'
)

export type NotCompleteCASResponse = TypeOf<typeof NotCompleteCASResponse>

export const CompleteCASResponse = type(
  {
    ...NotCompleteCASResponse.props,
    status: literal(RequestStatusName.COMPLETED),
    anchorCommit: CommitPresentation,
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
