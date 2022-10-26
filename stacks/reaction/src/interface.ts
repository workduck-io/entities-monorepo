import { BaseEntityParameters, GenericObject } from '@mex/entity-utils';

export interface Reaction extends BaseEntityParameters {
  status: string;
  content: GenericObject[];
}

export interface ReactionRequest {
  workspaceId?: string;
  blockId: string;
  nodeId: string;
  reaction: {
    type: string;
    value: string;
  };
  action: 'ADD' | 'REMOVE';
}
