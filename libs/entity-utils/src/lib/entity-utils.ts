import DynamoDB from 'aws-sdk/clients/dynamodb';
import { Entity, Table } from 'dynamodb-toolbox';
import { TableIndexes } from 'dynamodb-toolbox/dist/classes/Table';
import { MAX_DYNAMO_BATCH_REQUEST } from './consts';
import {
  BaseEntityParameters,
  BatchUpdateRequest,
  ENTITY_STRING,
  ENTITY_TYPE,
  STATUS_STRING,
  STATUS_TYPE,
  UpdateSource,
} from './interface';
import { batchPromises, getEndpoint, getRegion } from './utils';

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
      'pk-ak-index': {
        partitionKey: 'pk',
        sortKey: 'ak',
      },
      'sk-ak-index': {
        partitionKey: 'sk',
        sortKey: 'ak',
      },
      ...additionalIndexes,
    },

    // Add the DocumentClient
    DocumentClient,
  });
};

export const defaultEntityAttributes: {
  workspaceId: { partitionKey: true; type: 'string' };
  entityId: {
    sortKey: true;
    type: 'string';
    coerce: false;
  };
  nodeId: { type: 'string'; map: 'ak'; coerce: false };
  _source: { type: 'string'; default: () => 'INTERNAL'; hidden: true };
  _status: { type: 'string'; default: () => 'ACTIVE'; hidden: true };
  _ttl: { type: 'number'; hidden: true };
  userId: { type: 'string'; required: true };
  properties: { type: 'map' };
} = {
  workspaceId: { partitionKey: true, type: 'string' },
  entityId: {
    sortKey: true,
    type: 'string',
    coerce: false,
  },
  nodeId: { type: 'string', map: 'ak', coerce: false },
  _source: { type: 'string', default: () => 'INTERNAL', hidden: true },
  _status: { type: 'string', default: () => 'ACTIVE', hidden: true },
  _ttl: { type: 'number', hidden: true },
  userId: { type: 'string', required: true },
  properties: { type: 'map' },
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
  const requestFull = uniqueRequest.map((r) => {
    const { type, ...req } = r;
    const wsId = workspaceId ?? req.workspaceId;

    switch (type) {
      case 'CREATE':
      case 'UPDATE':
        return {
          ...req,
          workspaceId: wsId,
          _source: source ?? 'INTERNAL',
          $remove: ['_ttl'],
        };
      case 'DELETE':
        return {
          ...req,
          workspaceId: wsId,
          _source: source ?? 'INTERNAL',
          _status: 'ARCHIVED',
          _ttl: ttlDate,
        };
    }
  });
  const result = await batchPromises<any, any>(
    MAX_DYNAMO_BATCH_REQUEST,
    requestFull,
    (i) =>
      new Promise((resolve, reject) => {
        try {
          resolve(
            associatedEntity
              .update(i as any, {
                returnValues: 'UPDATED_NEW',
              })
              .then((e) => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                //@ts-ignore
                const { modified, created } = e.Attributes;
                return {
                  modified,
                  created,
                  ...extractEssentialFields(i),
                };
              })
          );
        } catch (e) {
          reject({
            ...extractEssentialFields(i),
            reason: e.message,
          });
        }
      })
  );

  return result.reduce(
    (acc, result) => {
      return {
        ...acc,
        [result.status]: [
          ...acc[result.status],
          result.value ?? result.reason ?? {},
        ],
      };
    },
    { fulfilled: [], rejected: [] }
  );
};

export const statusFilter = (
  status: STATUS_TYPE
): {
  attr: STATUS_STRING;
  eq: STATUS_TYPE;
} => ({
  attr: '_status',
  eq: status,
});

export const entityFilter = (
  type: ENTITY_TYPE
): {
  attr: ENTITY_STRING;
  eq: ENTITY_TYPE;
} => ({
  attr: 'entity',
  eq: type,
});
