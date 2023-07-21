import {
  HTTPMethod,
  Route,
  RouteAndExec,
  ValidatedAPIGatewayProxyEvent,
} from '@workduck-io/lambda-routing';
import { extractWorkspaceId } from '@mex/gen-utils';
import { v4 as uuidv4 } from 'uuid';
import { createError } from '@middy/util';
import { SuperblockEntity } from '../entities';
import { Superblock } from '../interface';

export class SuperblockHandler {
  @Route({
    method: HTTPMethod.POST,
    path: '/superblock',
  })
  async createSuperblock(event: ValidatedAPIGatewayProxyEvent<any>) {
    const { name } = event.body;
    if (!name) {
      throw createError(400,
        JSON.stringify({ message: 'Name is required.' })
      );
    }
    const workspaceId = extractWorkspaceId(event);
    const superblockId = uuidv4();
    const item: Superblock = {
      workspaceId,
      superblockId,
      name,
      config: {
        Bottom: [],
      }
    }
    await SuperblockEntity.update(item);
    return {
      statusCode: 200,
      body: JSON.stringify({
        superblockId: superblockId,
      }),
    };
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/superblock/{superblockId}',
  })
  async getSuperblock(event: ValidatedAPIGatewayProxyEvent<any>) {
    const { pathParameters } = event;
    const { superblockId } = pathParameters;
    const workspaceId = extractWorkspaceId(event);
    const superblock = await SuperblockEntity.get({ workspaceId, superblockId });

    if (!superblock) {
      throw createError(404, JSON.stringify({ message: 'Superblock not found.' }));
    }
    return {
      statusCode: 200,
      body: JSON.stringify(superblock),
    };
  }

  @Route({
    method: HTTPMethod.DELETE,
    path: '/superblock/{superblockId}',
  })
  async deleteSuperblock(event: ValidatedAPIGatewayProxyEvent<any>) {
    const { pathParameters } = event;
    const { superblockId } = pathParameters;
    const workspaceId = extractWorkspaceId(event);
    const superBlockResponse = await SuperblockEntity.get({ workspaceId, superblockId });
    if (!superBlockResponse.Item) {
      throw createError(
        404,
        JSON.stringify({
          statusCode: 404,
          message: 'Superblock not found',
        })
      );
    }
    await SuperblockEntity.delete({ workspaceId, superblockId });
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Superblock deleted successfully.' }),
    };
  }
  @Route({
    method: HTTPMethod.GET,
    path: '/superblock/{superblockId}/all',
  })

  async getAllSuperblocks(event: ValidatedAPIGatewayProxyEvent<any>) {
    const { pathParameters } = event;
    const { superblockId } = pathParameters;
    const workspaceId = extractWorkspaceId(event);
    const allSuperblockProperties = (await SuperblockEntity.get<Superblock>({ workspaceId, superblockId }));
    return {
      statusCode: 200,
      body: JSON.stringify(
        allSuperblockProperties.Item.config
      ),
    };
  }
  @RouteAndExec()
  execute(event) {
    return event;
  }
}
