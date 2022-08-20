import { initializeTable } from '@mex/entity-utils';

export const taskTable = initializeTable({
  name: `${process.env.SLS_STAGE}-task-store`,
});
