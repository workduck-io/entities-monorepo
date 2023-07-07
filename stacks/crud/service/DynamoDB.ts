import { initializeTable } from '@mex/entity-utils';

export const crudTable = initializeTable({
  name: `${process.env.SLS_STAGE}-entity-store`,
});
