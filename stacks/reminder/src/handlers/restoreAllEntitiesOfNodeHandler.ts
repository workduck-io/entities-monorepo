import { getAccess } from '@mex/access-checker';
import {
  BatchUpdateRequest,
  entityFilter,
  executeBatchRequest,
  statusFilter,
} from '@mex/entity-utils';
import { extractWorkspaceId } from '@mex/gen-utils';
import { createError } from '@middy/util';
import { ValidatedAPIGatewayProxyHandler } from '@workduck-io/lambda-routing';
import { ReminderEntity } from '../entities';
import { Reminder } from '../interface';

export const restoreAllEntitiesOfNodeHandler: ValidatedAPIGatewayProxyHandler<
  undefined
> = async (event) => {
  try {
    const nodeId = event.pathParameters.nodeId;
    const workspaceId = extractWorkspaceId(event);
    const access = await getAccess(workspaceId, nodeId, event);
    if (access === 'NO_ACCESS' || access === 'READ')
      throw createError(401, 'User access denied');

    const tasksToRestore = (
      await ReminderEntity.query(workspaceId, {
        index: 'pk-ak-index',
        eq: nodeId,
        filters: [statusFilter('ARCHIVED'), entityFilter('reminder')],
      })
    ).Items;

    const batchReq: BatchUpdateRequest<Partial<Reminder>> = tasksToRestore.map(
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
