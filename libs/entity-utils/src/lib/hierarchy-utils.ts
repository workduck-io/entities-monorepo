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
      parentPath = (parentItem.Item?.path as string) ?? ' ';
    }
    console.log({
      ...rest,
      path: parent ? parentPath + parent + '|' : this.entity.name,
    });
    const transactions = [
      HierarchyEntity.updateTransaction(
        {
          ...rest,
          path: parent ? parentPath + parent + '|' : this.entity.name,
        },
        {}
      ),
      this.entity.updateTransaction(entityDetails),
    ];
    return await HierarchyTable.transactWrite(transactions);
  };

  getItem = async (entityId: string) => {
    const hItem = (await HierarchyEntity.get({ entityId })).Item;
    const item = await this.entity.get({
      entityId,
      workspaceId: hItem.workspaceId,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
    }).Item;
    return {
      ...item,
      path: hItem.path,
    };
  };

  getItemAncestors = async (entityId: string) => {
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
              return this.getItem(id);
            })
        ))
      );
    }
    return result;
  };

  getItemChildren = async (entityId: string) => {
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
        this.entity.deleteBatch({
          entityId: item.entityId,
          workspaceId: item.workspaceId,
        })
      );
      await HierarchyTable.batchWrite([...deleteQuery, ...deleteQueryOg]);
    }
    await HierarchyEntity.delete({ entityId });
    await this.entity.delete({ entityId, workspaceId: item.workspaceId });
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
      path: (newParent.path ?? '') + newParentId + '|',
    });
  };

  getGraph = async (workspaceId: string) => {
    return (
      await HierarchyEntity.query(workspaceId, {
        eq: this.entity.name,
        index: 'tree-path-index',
      })
    ).Items;
  };
}
