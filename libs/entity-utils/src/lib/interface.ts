import { DocumentClient } from 'aws-sdk/clients/dynamodb';

export interface BaseEntityParameters {
  workspaceId: string;
  nodeId: string;
  entityId: string;
  blockId?: string;
  properties?: Record<string, any>;
}
export type BatchRequestUnit<T extends BaseEntityParameters> = T & {
  type: 'UPDATE' | 'CREATE' | 'DELETE';
};

export type BatchRequest<T extends BaseEntityParameters> =
  BatchRequestUnit<T>[];

export type DynamoBatchRequest = {
  [key: string]: DocumentClient.WriteRequest;
};
