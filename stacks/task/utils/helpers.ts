import { WDError } from '@workduck-io/wderror';
import merge from 'deepmerge';
import jwt_decode from 'jwt-decode';
import { STATUS_STRING, STATUS_TYPE, WDTokenDecode } from './types';

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

export const combineMerge = (target, source, options) => {
  const destination = target.slice();

  source.forEach((item, index) => {
    if (typeof destination[index] === 'undefined') {
      destination[index] = options.cloneUnlessOtherwiseSpecified(item, options);
    } else if (options.isMergeableObject(item)) {
      destination[index] = merge(target[index], item, options);
    } else if (target.indexOf(item) === -1) {
      destination.push(item);
    }
  });
  return destination;
};

export const itemFilter = (
  status: STATUS_TYPE
): {
  attr: STATUS_STRING;
  eq: STATUS_TYPE;
} => ({
  attr: '_status',
  eq: status,
});
