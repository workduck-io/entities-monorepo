import { BaseEntityParameters } from '@mex/entity-utils';

export interface Variable extends BaseEntityParameters {
  variableName: string;
  entityId?: string;
}

export interface Smartcapture extends BaseEntityParameters {
  entityId?: string;
  variableId: string;
  labelName: string;
  path: string;
  webPage: string;
  regex: string;
}
