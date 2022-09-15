import DynamoDB from 'aws-sdk/clients/dynamodb';
import { Entity, Table } from 'dynamodb-toolbox';
import { AttributeDefinitions } from 'dynamodb-toolbox/dist/classes/Entity';
import { TableDef, TableIndexes } from 'dynamodb-toolbox/dist/classes/Table';
import {
  BaseEntityParameters,
  BatchUpdateRequest,
  DynamoBatchUpdateRequest,
  UpdateSource,
} from './interface';
import { chunkify, getEndpoint, getRegion } from './utils';

export function entityUtils(): string {
  return 'entity-utils';
}

const DocumentClient = new DynamoDB.DocumentClient({
  service: new DynamoDB({
    endpoint: getEndpoint(),
    region: getRegion(),
  }),
});

export const initializeTable = (tableConfig: {
  name: string;
  additionalIndexes?: TableIndexes;
}) => {
  const { name, additionalIndexes } = tableConfig;
  return new Table({
    // Specify table name (used by DynamoDB)
    name,
    // Define partition and sort keys
    partitionKey: 'pk',
    sortKey: 'sk',
    indexes: {
      'ak-pk-index': {
        partitionKey: 'ak',
        sortKey: 'pk',
      },
      'reverse-index': {
        partitionKey: 'sk',
        sortKey: 'ak',
      },
      ...additionalIndexes,
    },

    // Add the DocumentClient
    DocumentClient,
  });
};

export const initializeEntity = (entityConfig: {
  table: TableDef;
  name: string;
  additionalAttributes?: AttributeDefinitions;
}) => {
  const { table, name, additionalAttributes } = entityConfig;
  return new Entity({
    name: name,
    attributes: {
      workspaceId: { partitionKey: true, type: 'string' },
      entityId: {
        sortKey: true,
        type: 'string',
      },
      nodeId: { type: 'string', required: true, map: 'ak' },
      source: { type: 'string', default: () => 'NOTE', hidden: true },
      properties: { type: 'map' },
      ...additionalAttributes,
    },
    table: table,
  } as const);
};

export const createBatchRequest = <
  T extends BaseEntityParameters
>(batchrequestParams: {
  request: BatchUpdateRequest<T>;
  associatedEntity: Entity;
  workspaceId?: string;
  source?: UpdateSource;
}) => {
  const { request, associatedEntity, source } = batchrequestParams;
  const workspaceId = batchrequestParams.workspaceId;
  return chunkify<DynamoBatchUpdateRequest>(
    request.map((r) => {
      const { type, ...req } = r;
      const wsId = workspaceId ?? req.workspaceId;
      switch (type) {
        case 'CREATE':
        case 'UPDATE':
          return associatedEntity.putBatch({
            ...req,
            workspaceId: wsId,
            source: source ?? 'NOTE',
          });
        case 'DELETE':
          return associatedEntity.deleteBatch({ ...req, workspaceId: wsId });
      }
    })
  );
};
