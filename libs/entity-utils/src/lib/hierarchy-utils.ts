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

  static getItem = async (entityId: string, entity: Entity) => {
    const hItem = (await HierarchyEntity.get({ entityId })).Item;
    return {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      ...(await entity.get({ entityId, workspaceId: hItem.workspaceId })).Item,
      path: hItem.path,
    };
  };

  static getItemAncestors = async (entityId: string, entity: Entity) => {
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
              return this.getItem(id, entity);
            })
        ))
      );
    }
    return result;
  };

  static getItemChildren = async (entityId: string, entity: Entity) => {
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

    const newRes = Promise.all(
      result.map(async (item) => {
        const actualEntity = await entity.get({
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

  static deleteItem = async (entityId: string, entity: Entity) => {
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
      const deleteQueryOg = itemsToDelete.map((item) =>
        entity.deleteBatch({
          entityId: item.entityId,
          workspaceId: item.workspaceId,
        })
      );
      await HierarchyTable.batchWrite([...deleteQuery, ...deleteQueryOg]);
    }
    await HierarchyEntity.delete({ entityId });
    await entity.delete({ entityId, workspaceId: item.workspaceId });
  };

  static refactorItem = async (entityId: string, newParentId: string) => {
    const item = (await HierarchyEntity.get({ entityId }))?.Item;
    console.log({ item });

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

      const updateQuery = [...itemsToUpdate, item].map((item) =>
        HierarchyEntity.putBatch({
          ...item,
          path: (newPath ?? '') + path.slice(path.length),
        })
      );
      console.log('Update query', updateQuery);

      await HierarchyTable.batchWrite(updateQuery);
    }
    await HierarchyEntity.update({
      ...item,
      path: (newParent.path ?? '') + newParentId + '|',
    });
  };
}
