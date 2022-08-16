import { validate } from '@workduck-io/workspace-validator';

export const extractWorkspaceId = (event) => {
  if (process.env.SLS_STAGE == 'local' && !validate(event))
    throw new Error('Invalid credentials');

  return event.headers['mex-workspace-id'];
};
