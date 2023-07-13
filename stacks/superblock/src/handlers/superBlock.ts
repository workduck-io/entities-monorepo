import {
  HTTPMethod,
  Route,
  RouteAndExec,
  ValidatedAPIGatewayProxyEvent,
} from '@workduck-io/lambda-routing';
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
    const superblockId = uuidv4();
    const item: Superblock = {
      name,
      superblockId,
      config: {
        Bottom: [],
      }
    }
    await SuperblockEntity.update(item);
    return {
      statusCode: 200,
      body: JSON.stringify({ id: superblockId }),
    };
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/superblock/{superblockId}',
  })
  async getSuperblock(event: ValidatedAPIGatewayProxyEvent<any>) {
    const { pathParameters } = event;
    const { superblockId } = pathParameters;

    const superblock = await SuperblockEntity.get({ superblockId, name: "Superblock-1" });

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

    const superBlockResponse = await SuperblockEntity.get({ superblockId, name: "Superblock-1" });
    if (!superBlockResponse.Item) {
      throw createError(
        404,
        JSON.stringify({
          statusCode: 404,
          message: 'Note not found',
        })
      );
    }
    await SuperblockEntity.delete({ superblockId, name: "Superblock-1" });
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Superblock deleted successfully.' }),
    };
  }

  @RouteAndExec()
  execute(event) {
    return event;
  }
}
