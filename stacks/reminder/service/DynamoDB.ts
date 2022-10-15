import { initializeTable } from '@mex/entity-utils';

export const reminderTable = initializeTable({
  name: `${process.env.SLS_STAGE}-reminder-store`,
});
