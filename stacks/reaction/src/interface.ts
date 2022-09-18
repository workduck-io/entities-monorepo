import { BaseEntityParameters, GenericObject } from '@mex/entity-utils';

export interface Reaction extends BaseEntityParameters {
  status: string;
  content: GenericObject[];
}
