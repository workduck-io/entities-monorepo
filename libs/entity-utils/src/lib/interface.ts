export interface BaseEntityParameters {
  workspaceId: string;
  nodeId: string;
  entityId: string;
  blockId?: string;
  properties: Record<string, any>;
}
export interface BatchRequestUnit<T extends BaseEntityParameters> {
  type: 'UPDATE' | 'CREATE' | 'DELETE';
  data: T;
}

export type BatchRequest<T extends BaseEntityParameters> =
  BatchRequestUnit<T>[];
