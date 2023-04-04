import { createError, HttpError } from '@middy/util';
import { Catch, WDError } from '@workduck-io/wderror';
import jwt_decode from 'jwt-decode';
import { WDTokenDecode } from './interfaces';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet(
  '346789ABCDEFGHJKLMNPQRTUVWXYabcdefghijkmnpqrtwxyz',
  21
);

export function genUtils(): string {
  return 'gen-utils';
}

export const extractWorkspaceId = (event) => {
  if (!event.headers['mex-workspace-id'])
    throw createError(
      400,
      JSON.stringify({
        statusCode: 400,
        message: 'mex-workspace-id header is required',
      })
    );
  return event.headers['mex-workspace-id'];
};
export const extractUserId = (event) => {
  if (!event.headers['mex-user-id'])
    throw createError(
      400,
      JSON.stringify({
        statusCode: 400,
        message: 'mex-user-id header is required',
      })
    );
  return event.headers['mex-user-id'];
};

export const extractApiVersion = (event) => {
  return event.headers['mex-api-ver'];
};

export const extractUserIdFromToken = (event): string => {
  const userId = (jwt_decode(event.headers.authorization) as WDTokenDecode).sub;

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
    throw createError(
      err.statusCode ?? 500,
      JSON.stringify({
        statusCode: err.statusCode ?? 500,
        message: err.message,
      }),
      { cause: err.cause }
    );
  });

export const generateCaptureId = () => {
  return `CAPTURE_${nanoid()}`;
};
