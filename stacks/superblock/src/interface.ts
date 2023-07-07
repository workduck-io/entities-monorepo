export interface Superblock {
  name: string;
  superblockId: string;
  config: Record<string, any>;
}

export interface SuperblockProperty {
  name: string;
  status: string;
  propertyId: string;
}
