import DynamoDB from 'aws-sdk/clients/dynamodb';
import { Entity, Table } from 'dynamodb-toolbox';
import { AttributeDefinitions } from 'dynamodb-toolbox/dist/classes/Entity';
import { TableDef, TableIndexes } from 'dynamodb-toolbox/dist/classes/Table';
import {
  BaseEntityParameters,
  BatchUpdateRequest,
  GenericObject,
  UpdateSource,
} from './interface';
import { chunkify, getEndpoint, getRegion, promisify } from './utils';

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
        coerce: false,
      },
      nodeId: { type: 'string', map: 'ak', coerce: false },
      source: { type: 'string', default: () => 'NOTE', hidden: true },
      _status: { type: 'string', default: () => 'ACTIVE', hidden: true },
      _ttl: { type: 'number', hidden: true },
      userId: { type: 'string', required: true },
      properties: { type: 'map' },
      ...additionalAttributes,
    },
    table: table,
  } as const);
};

const extractEssentialFields = (request: any) => ({
  nodeId: request.nodeId,
  entityId: request.entityId,
  workspaceId: request.workspaceId,
});

export const executeBatchRequest = async <
  T extends Partial<BaseEntityParameters>
>(batchrequestParams: {
  request: BatchUpdateRequest<T>;
  associatedEntity: Entity;
  workspaceId?: string;
  source?: UpdateSource;
}) => {
  const { request, associatedEntity, source } = batchrequestParams;
  const workspaceId = batchrequestParams.workspaceId;
  const ttlDate = new Date().setDate(new Date().getDate() + 30);
  const uniqueEntityIdSet = new Set();
  // We reverse the array to find the latest unique record instead of first
  const uniqueRequest = request.reverse().filter((r) => {
    const isUnique = !uniqueEntityIdSet.has(r.entityId);
    uniqueEntityIdSet.add(r.entityId);
    return isUnique;
  });
  const chunkifiedRequest = chunkify<GenericObject>(
    uniqueRequest.map((r) => {
      const { type, ...req } = r;
      const wsId = workspaceId ?? req.workspaceId;

      switch (type) {
        case 'CREATE':
        case 'UPDATE':
          return {
            ...req,
            workspaceId: wsId,
            source: source ?? 'NOTE',
            $remove: ['_ttl'],
          };
        case 'DELETE':
          return {
            ...req,
            workspaceId: wsId,
            source: source ?? 'NOTE',
            _status: 'ARCHIVED',
            _ttl: ttlDate,
          };
        default:
          throw new Error('type field does not exist!');
      }
    })
  );
  return (
    await Promise.all(
      chunkifiedRequest.map(
        async (updateRequestBatch) =>
          await promisify(
            updateRequestBatch.map(async (updateRequest) => {
              try {
                const { modified, created } = (
                  await associatedEntity.update(updateRequest, {
                    returnValues: 'UPDATED_NEW',
                  })
                ).Attributes;
                return {
                  modified,
                  created,
                  ...extractEssentialFields(updateRequest),
                };
              } catch (e) {
                throw new Error(
                  JSON.stringify({
                    ...extractEssentialFields(updateRequest),
                    reason: e.message,
                  })
                );
              }
            })
          )
      )
    )
  ).reduce((acc, result) => {
    return {
      fulfilled: [...(acc?.fulfilled ?? []), ...result.fulfilled],
      rejected: [...(acc?.rejected ?? []), ...result.rejected],
    };
  });
};
