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
    throw createError(400, 'mex-workspace-id header is required');
  return event.headers['mex-workspace-id'];
};
export const extractUserId = (event) => {
  if (!event.headers['mex-user-id'])
    throw createError(400, 'mex-user-id header is required');
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

export const generateHighlightId = () => {
  return `HIGHLIGHT_${nanoid()}`;
};

export function defaultEntitySerializer<T, K>(
  body: Partial<T>,
  params: { props?: any; callback?: (data: K) => K }
): K {
  const { props, callback } = params;
  const serializedData = {
    properties: {
      ...body,
    },
    ...props,
  } as K;

  if (!callback) return serializedData;
  else return callback(serializedData);
}

export function defaultEntityDeserializer<K, T>(
  body: Partial<K>,
  params: { callback?: (data: T) => T }
): T {
  const { callback } = params;
  const deserializedData = {
    ...body,
  } as T;

  if (!callback) return deserializedData;
  else return callback(deserializedData);
}
