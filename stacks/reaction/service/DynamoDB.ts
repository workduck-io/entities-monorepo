import { initializeTable } from '@mex/entity-utils';

export const reactionTable = initializeTable({
  name: `${process.env.SLS_STAGE}-entity-store`,
});
