export interface BaseEntityParameters {
  workspaceId: string;
  nodeId: string;
  entityId: string;
  blockId?: string;
  properties?: Record<string, any>;
}
export type BatchRequestUnit<T extends BaseEntityParameters> = {
  [key in keyof T]: unknown;
} & {
  type: 'UPDATE' | 'CREATE' | 'DELETE';
};

export type BatchRequest<T extends BaseEntityParameters> =
  BatchRequestUnit<T>[];
