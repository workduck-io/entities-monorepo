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
}
export type BatchRequestUnit<T extends BaseEntityParameters> = T & {
  type: 'UPDATE' | 'CREATE' | 'DELETE';
};

export type BatchRequest<T extends BaseEntityParameters> =
  BatchRequestUnit<T>[];

export type DynamoBatchRequest = {
  [key: string]: DocumentClient.WriteRequest;
};
