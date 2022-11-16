import { BaseEntityParameters, GenericObject } from '@mex/entity-utils';

export interface Highlights extends BaseEntityParameters {
  status: string;
  content: GenericObject[];
}
