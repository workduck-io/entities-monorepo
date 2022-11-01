import { initializeTable } from '@mex/entity-utils';

export const smartcaptureTable = initializeTable({
  name: `${process.env.SLS_STAGE}-entity-store`,
});
