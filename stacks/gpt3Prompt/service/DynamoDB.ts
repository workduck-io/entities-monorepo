import { initializeTable } from '@mex/entity-utils';

export const gpt3PromptTable = initializeTable({
  name: `${process.env.SLS_STAGE}-entity-store`,
});
