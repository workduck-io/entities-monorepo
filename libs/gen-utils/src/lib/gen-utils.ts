import { createError, HttpError } from '@middy/util';
import { CatchAll, WDError } from '@workduck-io/wderror';
import jwt_decode from 'jwt-decode';
import { customAlphabet } from 'nanoid';
import { WDTokenDecode } from './interfaces';

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
  CatchAll((err: HttpError) => {
    console.error(err);
    throw createError(err.statusCode ?? 500, err.message, { cause: err.cause });
  });

export const generateCaptureId = () => {
  return `CAPTURE_${nanoid()}`;
};

export const generateHighlightId = () => {
  return `HIGHLIGHT_${nanoid()}`;
};

export const generateEntityId = (suffix: string) => {
  return `${suffix}_${nanoid()}`;
};

export function defaultEntitySerializer<T, K>(
  body: Partial<T>,
  params?: {
    props?: any;
    callback?: (data: K) => K;
  }
): K {
  if (params) {
    const serializedData = {
      ...body,
      ...(params.props && params.props),
    } as K;

    if (!params.callback) return serializedData;
    else return params.callback(serializedData);
  } else return { ...body } as K;
}

export function defaultEntityDeserializer<K, T>(
  body: Partial<K>,
  params?: { callback?: (data: T) => T }
): T {
  if (params) {
    const { callback } = params;
    const deserializedData = {
      ...body,
    } as T;

    if (!callback) return deserializedData;
    else return callback(deserializedData);
  } else return { ...body } as T;
}
