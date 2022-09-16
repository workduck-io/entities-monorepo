import { BaseEntityParameters, GenericObject } from '@mex/entity-utils';

export interface Comment extends BaseEntityParameters {
  blockId: string;
  content: GenericObject[];
}
