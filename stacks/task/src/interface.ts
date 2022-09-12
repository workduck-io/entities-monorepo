import { BaseEntityParameters, GenericObject } from '@mex/entity-utils';

export interface Task extends BaseEntityParameters {
  status: string;
  content: GenericObject[];
}

export interface View extends BaseEntityParameters {
  filters: Record<string, GenericObject>;
}
