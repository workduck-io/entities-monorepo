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
  userId: string;
  nodeId?: string;
  entityId: string;
  blockId?: string;
  properties?: GenericObject;
  _source?: UpdateSource;
}

export type UpdateSource = 'INTERNAL' | 'EXTERNAL';

export type BatchUpdateRequestUnit<T extends Partial<BaseEntityParameters>> =
  T & {
    type: 'UPDATE' | 'CREATE' | 'DELETE';
  };

export type BatchUpdateRequest<T extends Partial<BaseEntityParameters>> =
  BatchUpdateRequestUnit<T>[];

export type DynamoBatchUpdateRequest = DocumentClient.UpdateItemOutput;

export type STATUS_STRING = '_status';
export type STATUS_TYPE = 'ARCHIVED' | 'ACTIVE';
export type ENTITY_STRING = 'entity';
export type ENTITY_TYPE =
  | 'task'
  | 'comment'
  | 'reminder'
  | 'view'
  | 'highlights'
  | 'captureVariable'
  | 'capture'
  | 'captureLabel';

export interface HierarchyItem {
  workspaceId: string;
  entityId: string;
  path: string;
  parent: string;
}

export interface HierarchyRequest {
  workspaceId: string;
  entityId: string;
  parent?: string;
}

export interface AdvancedElements {
  id: string;
  content?: string;
  children?: Array<AdvancedElements>;
  elementType: string;
  properties?: Record<string, any>;
  elementMetadata?: Record<string, any>;
  createdBy?: string;
  lastEditedBy?: string;
  createdAt?: number;
  updatedAt?: number;
  entityRefID?: string;
}

export interface AdvancedElementEntity {
  id?: string;
  data: AdvancedElements;
}
