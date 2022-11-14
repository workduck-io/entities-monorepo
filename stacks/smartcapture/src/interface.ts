import { BaseEntityParameters } from '@mex/entity-utils';

export interface Variable extends Omit<BaseEntityParameters, 'entityId'> {
  variableName: string;
  entityId?: string;
}

export interface Smartcapture extends Omit<BaseEntityParameters, 'entityId'> {
  variable?: Variable;
  variableId?: string;
  entityId?: string;
  labelName: string;
  path: string;
  webPage: string;
  regex: string;
}
