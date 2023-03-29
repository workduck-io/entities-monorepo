import { AdvancedElements, BaseEntityParameters } from '@mex/entity-utils';

export interface Variable extends Omit<BaseEntityParameters, 'entityId'> {
  variableName: string;
  entityId: string;
  defaultValue?: string;
}

export interface Label {
  id: string;
  name: string;
  path: string;
  properties: Record<string, string>;
  variableId?: string;
}

export interface Config extends Omit<BaseEntityParameters, 'entityId'> {
  workspaceId: string;
  entityId: string;
  base: string;
  dataOrder: string[];
  labels: Record<string, Label>;
  regex: string;
}

export interface CaptureLabel {
  id: string;
  label: string;
  value: string;
  properties: any;
}

export interface Capture {
  data: AdvancedElements[];
  configID?: string;
  workspaceID?: string;
  userID?: string;
  id?: string;
}
