import { getAccess } from '@mex/access-checker';
import {
  BatchUpdateRequest,
  executeBatchRequest,
  itemFilter,
} from '@mex/entity-utils';
import {
  extractWorkspaceId,
  ValidatedAPIGatewayProxyHandler,
} from '@mex/gen-utils';
import { createError } from '@middy/util';
import { ReminderEntity } from '../entities';
import { Reminder } from '../interface';

export const deleteAllEntitiesOfNodeHandler: ValidatedAPIGatewayProxyHandler<
  undefined
> = async (event) => {
  try {
    const nodeId = event.pathParameters.nodeId;
    const workspaceId = extractWorkspaceId(event);
    const access = await getAccess(workspaceId, nodeId, event);
    if (access === 'NO_ACCESS' || access === 'READ')
      throw createError(401, 'User access denied');

    const tasksToDelete = (
      await ReminderEntity.query(nodeId, {
        index: 'ak-pk-index',
        eq: nodeId,
        filters: [itemFilter('ACTIVE')],
      })
    ).Items;

    const batchReq: BatchUpdateRequest<Partial<Reminder>> = tasksToDelete.map(
      (task) => ({
        workspaceId: task.workspaceId,
        entityId: task.entityId,
        type: 'DELETE',
      })
    );

    await executeBatchRequest({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      associatedEntity: ReminderEntity,
      workspaceId,
      request: batchReq,
      _source: 'INTERNAL',
    });

    return {
      statusCode: 204,
      body: '',
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};
