import { DocumentClient } from 'aws-sdk/clients/dynamodb';

export type GenericValue =
  | string
  | object
  | number
  | boolean
  | undefined
  | null;

export interface GenericObject {
  [key: string]:
    | GenericValue
    | GenericObject
    | GenericValue[]
    | GenericObject[];
}
export interface BaseEntityParameters {
  workspaceId: string;
  nodeId?: string;
  entityId: string;
  blockId?: string;
  properties?: GenericObject;
  source: UpdateSource;
}

export type UpdateSource = 'NOTE' | 'EXTERNAL';

export type BatchUpdateRequestUnit<T extends BaseEntityParameters> = T & {
  type: 'UPDATE' | 'CREATE' | 'DELETE';
};

export type BatchUpdateRequest<T extends BaseEntityParameters> =
  BatchUpdateRequestUnit<T>[];

export type DynamoBatchUpdateRequest = {
  [key: string]: DocumentClient.WriteRequest;
};
