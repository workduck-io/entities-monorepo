import { WDError } from '@workduck-io/wderror';
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
  const userId = (jwt_decode(event.headers.authorization) as WDTokenDecode).sub;

  if (!userId)
    throw new WDError({
      message: 'Invalid token provided',
      code: 403,
      statusCode: 403,
    });

  return userId;
};
