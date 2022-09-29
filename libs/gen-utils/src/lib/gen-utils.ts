export function genUtils(): string {
  return 'gen-utils';
}

export const extractWorkspaceId = (event) => {
  return event.headers['mex-workspace-id'];
};

export const extractApiVersion = (event) => {
  return event.headers['mex-api-ver'];
};