export interface Superblock {
  workspaceId: string;
  superblockId: string;
  name: string;
  config: Record<string, any>;
}

export interface SuperblockProperty {
  workspaceId: string;
  propertyId: string;
  name: string;
  status: string;
  values?: string[];
  properties?: Record<string, any>;
}
