import DynamoDB from 'aws-sdk/clients/dynamodb';
import { Entity, Table } from 'dynamodb-toolbox';
import { AttributeDefinitions } from 'dynamodb-toolbox/dist/classes/Entity';
import { TableDef, TableIndexes } from 'dynamodb-toolbox/dist/classes/Table';
import { BaseEntityParameters, BatchRequest } from './interface';
import { getEndpoint, getRegion } from './utils';

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
      properties: { type: 'map' },
      ...additionalAttributes,
    },
    table: table,
  } as const);
};

export const createBatchRequest = <
  T extends BaseEntityParameters
>(batchrequestParams: {
  request: BatchRequest<T>;
  associatedEntity: Entity;
  workspaceId?: string;
}) => {
  const { request, associatedEntity } = batchrequestParams;
  const workspaceId = batchrequestParams.workspaceId;
  return request.map((req) => {
    const wsId = workspaceId ?? req.data.workspaceId;
    switch (req.type) {
      case 'CREATE':
      case 'UPDATE':
        return associatedEntity.putBatch({
          ...req.data,
          workspaceId: wsId,
        });
      case 'DELETE':
        return associatedEntity.deleteBatch({ ...req.data, workspaceId: wsId });
    }
  });
};
