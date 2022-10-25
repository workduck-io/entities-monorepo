import { initializeTable } from '@mex/entity-utils';

export const commentTable = initializeTable({
  name: `${process.env.SLS_STAGE}-entity-store`,
});
