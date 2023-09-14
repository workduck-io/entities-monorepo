import { extractWorkspaceId } from '@mex/gen-utils';
import { createError } from '@middy/util';
import {
  HTTPMethod,
  Route,
  RouteAndExec,
  ValidatedAPIGatewayProxyEvent,
} from '@workduck-io/lambda-routing';
import { SuperblockPropertyEntity } from '../entities';
import { SuperblockProperty } from '../interface';

export class SuperblockPropertyHandler {
  @Route({
    method: HTTPMethod.POST,
    path: '/',
  })
  async createProperty(
    event: ValidatedAPIGatewayProxyEvent<SuperblockProperty>
  ) {
    const { body } = event;
    const workspaceId = extractWorkspaceId(event);
    const item: SuperblockProperty = {
      workspaceId: workspaceId,
      ...body,
    };
    const result = (
      await SuperblockPropertyEntity.update(item, {
        returnValues: 'ALL_NEW',
      })
    ).Attributes;
    return {
      statusCode: 200,
      body: JSON.stringify(result),
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
    const property = await SuperblockPropertyEntity.get({
      workspaceId,
      propertyId,
    });
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
      body: JSON.stringify(property.Item),
    };
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/all',
  })
  async getAllProperties(
    event: ValidatedAPIGatewayProxyEvent<SuperblockProperty>
  ) {
    const workspaceId = extractWorkspaceId(event);
    const property = await SuperblockPropertyEntity.query(workspaceId);
    if (!property.Items) {
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
      body: JSON.stringify(property.Items),
    };
  }

  @Route({
    method: HTTPMethod.POST,
    path: '/{propertyId}',
  })
  async updateProperty(
    event: ValidatedAPIGatewayProxyEvent<SuperblockProperty>
  ) {
    const { body, pathParameters } = event;
    const { propertyId } = pathParameters;
    const workspaceId = extractWorkspaceId(event);
    const existingPropertyResponse = await SuperblockPropertyEntity.get({
      workspaceId,
      propertyId,
    });
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
    const updatedProperty = {
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
    method: HTTPMethod.POST,
    path: '/{propertyId}/value',
  })
  async updatePropertyValues(event: ValidatedAPIGatewayProxyEvent<any>) {
    const { body, pathParameters } = event;
    const { propertyId } = pathParameters;
    const workspaceId = extractWorkspaceId(event);
    const existingPropertyResponse = await SuperblockPropertyEntity.get({
      workspaceId,
      propertyId,
    });
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
    const updatedProperty = {
      ...existingProperty,
      values: [
        ...new Set([...(existingProperty.values as string[]), body.value]),
      ],
    };

    await SuperblockPropertyEntity.put(updatedProperty);

    return {
      statusCode: 200,
      body: JSON.stringify(updatedProperty),
    };
  }

  @Route({
    method: HTTPMethod.DELETE,
    path: '/{propertyId}/value',
  })
  async deletePropertyValues(event: ValidatedAPIGatewayProxyEvent<any>) {
    const { body, pathParameters } = event;
    const { propertyId } = pathParameters;
    const workspaceId = extractWorkspaceId(event);
    const existingPropertyResponse = await SuperblockPropertyEntity.get({
      workspaceId,
      propertyId,
    });
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
    const updatedProperty = {
      ...existingProperty,
      values: ((existingProperty?.values as string[]) ?? []).filter(
        (item) => item !== body.value
      ),
    };

    await SuperblockPropertyEntity.put(updatedProperty);

    return {
      statusCode: 200,
      body: JSON.stringify(updatedProperty),
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
    const existingPropertyResponse = await SuperblockPropertyEntity.get({
      workspaceId,
      propertyId,
    });
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
