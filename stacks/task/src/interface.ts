import { BaseEntityParameters } from '@mex/entity-utils';

export interface Task extends BaseEntityParameters {
  status: string;
}

export interface View extends BaseEntityParameters {
  filters: Record<string, any>;
}
