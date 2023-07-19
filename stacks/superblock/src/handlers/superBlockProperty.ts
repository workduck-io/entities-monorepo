import {
  HTTPMethod,
  Route,
  RouteAndExec,
  ValidatedAPIGatewayProxyEvent,
} from '@workduck-io/lambda-routing';
import { extractWorkspaceId } from '@mex/gen-utils';
import { v4 as uuidv4 } from 'uuid';
import { createError } from '@middy/util';
import { SuperblockPropertyEntity, SuperblockEntity } from '../entities';
import { SuperblockProperty, Superblock } from '../interface';

export class SuperblockPropertyHandler {
  @Route({
    method: HTTPMethod.POST,
    path: '/',
  })
  async createProperty(event: ValidatedAPIGatewayProxyEvent<any>) {
    const { body } = event;
    const workspaceId = extractWorkspaceId(event);
    const propertyId = uuidv4();
    const item: SuperblockProperty = {
      workspaceId: workspaceId,
      propertyId: propertyId,
      name: body.name,
      status: body.status,
      superblockId: body.superblockId,
    };
    const superblockId = body.superblockId;
    const superblockResponse = await SuperblockEntity.get<Superblock>({ workspaceId, superblockId });
    const superblock = superblockResponse.Item;
    if (superblock) {
      const config = superblock.config || { Bottom: [] };
      config.Bottom.push(propertyId);
      superblock.config = config;
      await SuperblockEntity.update(superblock);
    }

    await SuperblockPropertyEntity.update(item);
    return {
      statusCode: 200,
      body: JSON.stringify({ id: propertyId, name: body.name }),
    };
  }
  @Route({
    method: HTTPMethod.GET,
    path: '/{propertyId}',
  })
  async getProperty(event: ValidatedAPIGatewayProxyEvent<SuperblockProperty>) {
    const { pathParameters } = event;
    const { propertyId } = pathParameters;
    const workspaceId = extractWorkspaceId(event);
    const property = await SuperblockPropertyEntity.get({ workspaceId, propertyId });
    if (!property) {
      throw createError(
        404,
        JSON.stringify({
          statusCode: 404,
          message: 'Property not found',
        })
      );
    }
    return {
      statusCode: 200,
      body: JSON.stringify(property),
    };
  }

  @Route({
    method: HTTPMethod.PUT,
    path: '/{propertyId}',
  })
  async updateProperty(event: ValidatedAPIGatewayProxyEvent<SuperblockProperty>) {
    const { body, pathParameters } = event;
    const { propertyId } = pathParameters;
    const workspaceId = extractWorkspaceId(event);
    const existingPropertyResponse = await SuperblockPropertyEntity.get({ workspaceId, propertyId });
    if (!existingPropertyResponse.Item) {
      throw createError(
        404,
        JSON.stringify({
          statusCode: 404,
          message: 'Property not found',
        })
      );
    }
    const existingProperty = existingPropertyResponse.Item;
    const updatedProperty: SuperblockProperty = {
      ...existingProperty,
      ...body,
    };

    await SuperblockPropertyEntity.put(updatedProperty);

    return {
      statusCode: 200,
      body: JSON.stringify({ updatedProperty }),
    };
  }

  @Route({
    method: HTTPMethod.DELETE,
    path: '/{propertyId}',
  })
  async deleteProperty(event: ValidatedAPIGatewayProxyEvent<any>) {
    const { pathParameters } = event;
    const { propertyId } = pathParameters;
    const workspaceId = extractWorkspaceId(event);
    const existingPropertyResponse = await SuperblockPropertyEntity.get({ workspaceId, propertyId });
    if (!existingPropertyResponse.Item) {
      throw createError(
        404,
        JSON.stringify({
          statusCode: 404,
          message: 'Property not found',
        })
      );
    }
    await SuperblockPropertyEntity.delete({ workspaceId, propertyId });
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Property deleted successfully' }),
    };
  }

  @RouteAndExec()
  execute(event) {
    return event;
  }
}
