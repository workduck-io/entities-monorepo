import { initializeTable } from '@mex/entity-utils';

export const superblockTable = initializeTable({
  name: `${process.env.SLS_STAGE}-entity-store`,
});
