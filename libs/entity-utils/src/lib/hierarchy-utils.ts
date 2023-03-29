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
      if (!parentItem.Item) throw new Error('Parent doesnt exist');
      parentPath =
        (parentItem.Item?.path as string) ?? combineKeys(this.entity.name);
    }
    if ([...retrievePath(parentPath), parent].includes(request.entityId))
      throw createError(400, 'Circular logic found');

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
      this.entity.updateTransaction(entityDetails),
    ];
    return await HierarchyTable.transactWrite(transactions);
  };

  getItem = async (entityId: string) => {
    const hItem = (await HierarchyEntity.get({ entityId })).Item;
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

  getItemChildren = async (entityId: string, includeItem = true) => {
    const item = (await HierarchyEntity.get({ entityId })).Item;
    const parentPath = item.path.toString() ?? '';
    const result = includeItem ? [item] : [];

    result.push(
      ...(
        await HierarchyEntity.query(item.workspaceId, {
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
    if (!item) throw new Error('Item not found');
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
        await HierarchyTable.batchWrite(itemsToDelete);
    }
    await HierarchyEntity.delete({ entityId });
    await this.entity.delete({ entityId, workspaceId: item.workspaceId });
  };

  refactorItem = async (entityId: string, newParentId: string) => {
    const item = (await HierarchyEntity.get({ entityId }))?.Item;

    if (!item) throw new Error('Item not found');
    const path = combineKeys(item.path as string, entityId);

    const newParent = (await HierarchyEntity.get({ entityId: newParentId }))
      ?.Item;
    if (!newParent) throw new Error('Parent Item not found');
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
      return createError(400, 'Circular logic found');
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

  getGraph = async (workspaceId: string) => {
    return (
      await HierarchyEntity.query(workspaceId, {
        beginsWith: combineKeys(this.entity.name),
        index: 'tree-path-index',
      })
    ).Items;
  };
}
