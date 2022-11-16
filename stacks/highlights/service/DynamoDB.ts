import { initializeTable } from '@mex/entity-utils';

export const highlightsTable = initializeTable({
  name: `${process.env.SLS_STAGE}-entity-store`,
});
