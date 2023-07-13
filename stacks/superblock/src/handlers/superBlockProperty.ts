import {
  HTTPMethod,
  Route,
  RouteAndExec,
  ValidatedAPIGatewayProxyEvent,
} from '@workduck-io/lambda-routing';
import { v4 as uuidv4 } from 'uuid';
import { createError } from '@middy/util';
import { SuperblockPropertyEntity } from '../entities';
import { SuperblockProperty } from '../interface';

export class SuperblockPropertyHandler {
  @Route({
    method: HTTPMethod.POST,
    path: '/',
  })
  async createProperty(event: ValidatedAPIGatewayProxyEvent<SuperblockProperty>) {
    console.log(event);
    const { body } = event;

    console.log("ok");
    const propertyId = uuidv4();
    const item: SuperblockProperty = {
      propertyId: propertyId,
      name: body.name,
      status: body.status,
    }
    console.log(item);
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
    const property = await SuperblockPropertyEntity.get({ propertyId, name:"Create UI"});
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

    const existingPropertyResponse = await SuperblockPropertyEntity.get({ propertyId, name: "Create UI"});
    if (!existingPropertyResponse.Item) {
      throw createError(
        404,
        JSON.stringify({
          statusCode: 404,
          message: 'Property not found.',
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

    const existingPropertyResponse = await SuperblockPropertyEntity.get({ propertyId, name: 'Create UI'});
    if (!existingPropertyResponse.Item) {
      throw createError(
        404,
        JSON.stringify({
          statusCode: 404,
          message: 'Note not found',
        })
      );
    }
    await SuperblockPropertyEntity.delete({ propertyId, name: 'Create UI'});
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Property deleted successfully.' }),
    };
  }

  @RouteAndExec()
  execute(event) {
    return event;
  }
}
