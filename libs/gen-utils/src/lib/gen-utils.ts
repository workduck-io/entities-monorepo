import { createError, HttpError } from '@middy/util';
import { Catch, WDError } from '@workduck-io/wderror';
import jwt_decode from 'jwt-decode';
import { WDTokenDecode } from './interfaces';

export function genUtils(): string {
  return 'gen-utils';
}

export const extractWorkspaceId = (event) => {
  return event.headers['mex-workspace-id'];
};

export const extractApiVersion = (event) => {
  return event.headers['mex-api-ver'];
};

export const extractUserIdFromToken = (event): string => {
  const userId = (
    jwt_decode(
      event.headers.authorization ?? event.multiValueHeaders.Authorization[0]
    ) as WDTokenDecode
  ).sub;
  if (!userId)
    throw new WDError({
      message: 'Invalid token provided',
      code: 403,
      statusCode: 403,
    });

  return userId;
};

export const InternalError = (): any =>
  Catch(Error, (err: HttpError) => {
    throw createError(err.statusCode ?? 500, err.message, { cause: err.cause });
  });
