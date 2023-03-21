import { Entity, Table } from 'dynamodb-toolbox';
import { DocumentClient } from './client';
import { HierarchyRequest } from './interface';

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
  static addItem = async <T>(
    request: HierarchyRequest,
    entity: Entity,
    entityDetails: T
  ) => {
    let parentPath = '';
    const { parent, ...rest } = request;
    if (parent) {
      const parentItem = await HierarchyEntity.get({ entityId: parent });
      if (!parentItem.Item) throw new Error('Parent doesnt exist');
      parentPath = (parentItem.Item?.path as string) ?? '';
    }
    const transactions = [
      HierarchyEntity.updateTransaction({
        ...rest,
        path: parent ? parentPath + parent + '|' : '',
      }),
      entity.updateTransaction(entityDetails),
    ];
    return await HierarchyTable.transactWrite(transactions);
  };

  static getItem = async (entityId: string) => {
    return (await HierarchyEntity.get({ entityId })).Item;
  };

  static getItemAncestors = async (entityId: string) => {
    const item = (await HierarchyEntity.get({ entityId })).Item;
    const parentPath = item.path as string;
    const result = [item];

    if (parentPath) {
      result.push(
        ...(await Promise.all(
          parentPath
            .split('|')
            .slice(0, -1)
            .map(async (id) => {
              return (await HierarchyEntity.get({ entityId: id })).Item;
            })
        ))
      );
    }
    return result;
  };

  static getItemChildren = async (entityId: string) => {
    const item = (await HierarchyEntity.get({ entityId })).Item;
    const parentPath = item.path ?? '';
    const result = [item];

    result.push(
      ...(
        await HierarchyEntity.query(item.workspaceId, {
          index: 'tree-path-index',
          beginsWith: parentPath + entityId + '|',
          parseAsEntity: 'hierarchy',
        })
      ).Items
    );

    return result;
  };

  static deleteItem = async (entityId: string) => {
    const item = (await HierarchyEntity.get({ entityId }))?.Item;
    if (!item) throw new Error('Item not found');
    const path = (item.path ?? '') + entityId + '|';
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
      await HierarchyTable.batchWrite(deleteQuery);
    }
    HierarchyEntity.delete({ entityId });
  };

  static refactorItem = async (entityId: string, newParentId: string) => {
    const item = (await HierarchyEntity.get({ entityId }))?.Item;
    if (!item) throw new Error('Item not found');
    const path = (item.path ?? '') + entityId + '|';

    const newParent = (await HierarchyEntity.get({ entityId: newParentId }))
      ?.Item;
    if (!newParent) throw new Error('Parent Item not found');
    const newPath = (newParent.path ?? '') + newParentId + '|' + entityId + '|';
    if (path) {
      const itemsToUpdate = (
        await HierarchyEntity.query(item.workspaceId, {
          index: 'tree-path-index',
          beginsWith: path,
          parseAsEntity: 'hierarchy',
        })
      ).Items;
      const updateQuery = itemsToUpdate.map((item) =>
        HierarchyEntity.putBatch({
          ...item,
          path: (newPath ?? '') + path.slice(path.length),
        })
      );
      await HierarchyTable.batchWrite(updateQuery);
    }
    await HierarchyEntity.update({
      ...item,
      path: (newParent.path ?? '') + newParentId + '|',
    });
  };
}
