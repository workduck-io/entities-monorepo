import { BaseEntityParameters } from '@mex/entity-utils';

export interface Highlights extends BaseEntityParameters {
  _ct?: string;
  createdAt: number;
  status: string;
}
