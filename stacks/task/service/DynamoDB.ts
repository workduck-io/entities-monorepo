import { initializeTable } from '@mex/entity-utils';

export const taskTable = initializeTable({
  name: `${process.env.SLS_STAGE}-task-store`,
  additionalIndexes: {
    'ak-pk-index': {
      partitionKey: 'ak',
      sortKey: 'pk',
    },
  },
});
