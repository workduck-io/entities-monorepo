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
    path: '/',
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
    path: '/{id}',
  })
  async getSuperblock(event: ValidatedAPIGatewayProxyEvent<any>) {
    const superblockId = event.pathParameters.id;
    const superblock = await SuperblockEntity.get({ superblockId });

    if (!superblock) {
      throw createError(404, JSON.stringify({ message: 'Superblock not found.' }));
    }
    return {
      statusCode: 200,
      body: JSON.stringify(superblock.Item),
    };
  }

  @Route({
    method: HTTPMethod.DELETE,
    path: '/{id}',
  })
  async deleteSuperblock(event: ValidatedAPIGatewayProxyEvent<any>) {
    const superblockId = event.pathParameters.id;

    await SuperblockEntity.delete({ superblockId });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Superblock deleted successfully.' }),
    };
  }

  @RouteAndExec()
  execute(event: any) {
    return event;
  }
}
