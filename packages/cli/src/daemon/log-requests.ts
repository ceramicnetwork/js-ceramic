import { Request, Response } from 'express';
import { LoggerProvider } from '@ceramicnetwork/common';
import morgan from 'morgan';

const ACCESS_LOG_FMT = 'ip=:remote-addr ts=:date[iso] method=:method original_url=:original-url base_url=:base-url path=:path http_version=:http-version req_header:req[header] status=:status content_length=:res[content-length] content_type=":res[content-type]" ref=:referrer user_agent=:user-agent elapsed_ms=:total-time[3] error_message=:error-message error_code=:error-code';

export function logRequests(loggerProvider: LoggerProvider): any[] {
  morgan.token<Request, Response>('error-message', (req) => {
    return req.error?.message;
  });
  morgan.token<Request, Response>('error-code', (req) => {
    return req.error?.code;
  });
  morgan.token<Request, Response>('original-url', (req) => {
    return req.originalUrl;
  });
  morgan.token<Request, Response>('base-url', (req) => {
    return req.baseUrl;
  });
  morgan.token<Request, Response>('path', (req) => {
    return req.path;
  });

  const logger = loggerProvider.makeServiceLogger('http-access');

  return [morgan(ACCESS_LOG_FMT, { stream: logger })];
}
