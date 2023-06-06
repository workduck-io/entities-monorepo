import { createError } from '@middy/util';
import { Entity, Table } from 'dynamodb-toolbox';
import { DocumentClient } from './client';
import { HierarchyRequest } from './interface';
import { combineKeys, retrievePath } from './utils';

const initializeHierarchyTable = (tableConfig: { name: string }) => {
  const { name } = tableConfig;
  return new Table({
    // Specify table name (used by DynamoDB)
    name,
    // Define partition and sort keys
    partitionKey: 'pk',
    indexes: {
      'tree-path-index': {
        partitionKey: 'tree',
        sortKey: 'path',
      },
    },

    // Add the DocumentClient
    DocumentClient,
  });
};

const HierarchyTable = initializeHierarchyTable({
  name: `${process.env.SLS_STAGE}-hierarchy-store`,
});

const HierarchyEntity = new Entity({
  name: 'hierarchy',
  table: HierarchyTable,
  attributes: {
    entityId: {
      partitionKey: true,
    },
    path: {
      type: 'string',
    },
    workspaceId: {
      map: 'tree',
      type: 'string',
    },
  },
});

export class HierarchyOps {
  private entity: Entity;

  constructor(entity: Entity) {
    this.entity = entity;
  }
  addItem = async <T>(request: HierarchyRequest, entityDetails: T) => {
    let parentPath = '';
    const { parent, ...rest } = request;
    if (parent) {
      const parentItem = await HierarchyEntity.get({ entityId: parent });
      if (!parentItem.Item)
        throw createError(
          404,
          JSON.stringify({ statusCode: 404, message: 'Parent doesnt exist' })
        );
      parentPath =
        (parentItem.Item?.path as string) ?? combineKeys(this.entity.name);
    }
    if ([...retrievePath(parentPath), parent].includes(request.entityId))
      throw createError(
        400,
        JSON.stringify({ statusCode: 400, message: 'Circular logic found' })
      );

    const transactions = [
      HierarchyEntity.updateTransaction(
        {
          ...rest,
          path: parent
            ? combineKeys(parentPath, parent)
            : combineKeys(this.entity.name),
        },
        {}
      ),
      this.entity.putTransaction(entityDetails),
    ];
    return await HierarchyTable.transactWrite(transactions);
  };

  getItem = async (entityId: string) => {
    const hItem = (await HierarchyEntity.get({ entityId })).Item;
    if (!hItem)
      throw createError(
        404,
        JSON.stringify({ statusCode: 404, message: 'Entity doesnt exist' })
      );
    const item = (
      (await this.entity.get({
        entityId,
        workspaceId: hItem.workspaceId,
      })) as any
    ).Item;
    return {
      ...item,
      path: hItem.path,
    };
  };

  getItemAncestors = async (entityId: string, includeItem = true) => {
    const item = (await HierarchyEntity.get({ entityId })).Item;
    if (!item)
      throw createError(
        404,
        JSON.stringify({ statusCode: 404, message: 'Entity doesnt exist' })
      );
    const parentPath = item.path as string;
    const result = includeItem ? [item] : [];

    if (parentPath != this.entity.name) {
      result.push(
        ...(await Promise.all(
          retrievePath(parentPath).map(async (id) => {
            return this.getItem(id);
          })
        ))
      );
    }
    return result;
  };

  getItemChildren = async (
    entityId: string,
    workspaceId = null,
    includeItem = true
  ) => {
    const item = (await HierarchyEntity.get({ entityId })).Item;
    if (!item)
      throw createError(
        404,
        JSON.stringify({ statusCode: 404, message: 'Parent doesnt exist' })
      );
    const parentPath = item.path.toString() ?? '';
    const result = includeItem ? [item] : [];

    result.push(
      ...(
        await HierarchyEntity.query(workspaceId ?? item.workspaceId, {
          index: 'tree-path-index',
          beginsWith: parentPath
            ? combineKeys(parentPath, entityId)
            : combineKeys(this.entity.name),
          parseAsEntity: 'hierarchy',
        })
      ).Items
    );

    const newRes = Promise.all(
      result.map(async (item) => {
        const actualEntity = await this.entity.get({
          entityId: item.entityId,
          workspaceId: item.workspaceId,
        });
        return {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          ...actualEntity.Item,
          path: item.path,
        };
      })
    );

    return newRes;
  };

  deleteItem = async (entityId: string) => {
    const item = (await HierarchyEntity.get({ entityId }))?.Item;
    if (!item)
      throw createError(
        404,
        JSON.stringify({ statusCode: 404, message: 'Item not found' })
      );
    const path = combineKeys(item.path as string, entityId);

    if (path) {
      const itemsToDelete = (
        await HierarchyEntity.query(item.workspaceId, {
          index: 'tree-path-index',
          beginsWith: path,
          parseAsEntity: 'hierarchy',
        })
      ).Items;

      const deleteQuery = itemsToDelete.map((item) =>
        HierarchyEntity.deleteBatch({ entityId: item.entityId })
      );
      const deleteQueryOg = itemsToDelete.map((item) =>
        this.entity.deleteBatch({
          entityId: item.entityId,
          workspaceId: item.workspaceId,
        })
      );
      const itemsToRemove = [...deleteQuery, ...deleteQueryOg];
      if (itemsToRemove.length > 0)
        await HierarchyTable.batchWrite(itemsToRemove);
    }
    await HierarchyEntity.delete({ entityId });
    await this.entity.delete({ entityId, workspaceId: item.workspaceId });
  };

  refactorItem = async (entityId: string, newParentId: string) => {
    const item = (await HierarchyEntity.get({ entityId }))?.Item;

    if (!item)
      throw createError(
        404,
        JSON.stringify({ statusCode: 404, message: 'Item not found' })
      );
    const path = combineKeys(item.path as string, entityId);

    const newParent = (await HierarchyEntity.get({ entityId: newParentId }))
      ?.Item;
    if (!newParent)
      throw createError(
        404,
        JSON.stringify({ statusCode: 404, message: 'Parent doesnt exist' })
      );
    const newPath = combineKeys(
      newParent.path as string,
      newParentId,
      entityId
    );
    if (
      [...retrievePath(newParent.path as string), newParentId].includes(
        entityId
      )
    )
      return createError(
        400,
        JSON.stringify({ statusCode: 400, message: 'Circular logic found' })
      );
    if (path) {
      const itemsToUpdate = (
        await HierarchyEntity.query(item.workspaceId, {
          index: 'tree-path-index',
          beginsWith: path,
          parseAsEntity: 'hierarchy',
        })
      ).Items;

      const updateQuery = [...itemsToUpdate, item].map((item) =>
        HierarchyEntity.putBatch({
          ...item,
          path: (newPath ?? '') + path.slice(path.length),
        })
      );
      await HierarchyTable.batchWrite(updateQuery);
    }
    await HierarchyEntity.update({
      ...item,
      path: combineKeys(newParent.path as string, newParentId),
    });
  };

  getGraph = async (workspaceId: string, parent = '') => {
    return (
      await HierarchyEntity.query(workspaceId, {
        beginsWith:
          parent === '' ? combineKeys(this.entity.name) : combineKeys(parent),
        index: 'tree-path-index',
      })
    ).Items;
  };

  getAllByTree = async (workspaceId: string) => {
    const pageSize = 100;
    let lastKey = null;
    const hierarchyResults = [];
    const highlightResults = [];

    // eslint-disable-next-line no-constant-condition
    while (true) {
      hierarchyResults.length = 0;
      const queryResult = await HierarchyEntity.query(workspaceId, {
        startKey: lastKey && {
          pk: lastKey,
          tree: workspaceId,
          path: combineKeys(this.entity.name),
        },
        limit: pageSize,
        index: 'tree-path-index',
        parseAsEntity: 'hierarchy',
      });
      hierarchyResults.push(...queryResult.Items);
      lastKey = queryResult?.LastEvaluatedKey?.pk;

      const keys = hierarchyResults.map((item) => {
        return this.entity.getBatch({
          entityId: item.entityId,
          workspaceId: item.workspaceId,
        });
      });

      highlightResults.push(
        ...(await this.entity.table.batchGet(keys)).Responses[
          this.entity.table.name
        ]
      );
      if (!lastKey) break;
    }
    console.log(highlightResults.length);

    if (highlightResults.length) return highlightResults;
    else return [];
  };
}

export const getPathForEntity = async (
  hierarchyOps: HierarchyOps,
  workspaceId: string,
  res: any[],
  parent = ''
) => {
  const hierarchy = (await hierarchyOps.getGraph(workspaceId, parent)).map(
    (hItem) => ({
      path: hItem.path,
      ...res.find((item) => item.entityId === hItem.entityId),
    })
  );
  return hierarchy.filter((item) => item.entityId);
};
