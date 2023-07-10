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
      name: "create ui",
      status: "todo",
    }
    console.log(item);
    await SuperblockPropertyEntity.update(item);
    return {
      statusCode: 200,
      body: JSON.stringify({ id: propertyId }),
    };
  }
  @Route({
    method: HTTPMethod.GET,
    path: '/{id}',
  })
  async getProperty(event: ValidatedAPIGatewayProxyEvent<any>) {
    const propertyId = event.pathParameters.id;
    const property = await SuperblockPropertyEntity.get({ propertyId, name: 'Create UI' });
    return {
      statusCode: 200,
      body: JSON.stringify(property),
    };
  }

  @Route({
    method: HTTPMethod.PATCH,
    path: '/{id}',
  })
  async updateProperty(event: ValidatedAPIGatewayProxyEvent<any>) {
    const { body } = event;
    const propertyId = event.pathParameters.id;

    if (!body || !body.status || !['todo', 'inprogress', 'done'].includes(body.status)) {
      throw createError(400, JSON.stringify({ statusCode: 400, message: 'Invalid status value.' }));
    }

    const existingProperty = await SuperblockPropertyEntity.get({ propertyId, name: 'Create UI'});
    if (!existingProperty) {
      throw createError(
        404,
        JSON.stringify({
          statusCode: 404,
          message: 'Property not found.',
        })
      );
    }

    const updatedProperty: SuperblockProperty = {
      ...existingProperty.Item,
      status: body.status,
    };

    await SuperblockPropertyEntity.update(updatedProperty);

    return {
      statusCode: 200,
      body: JSON.stringify({ status: updatedProperty.status }),
    };
  }

  @Route({
    method: HTTPMethod.DELETE,
    path: '/{id}',
  })
  async deleteProperty(event: ValidatedAPIGatewayProxyEvent<any>) {
    const propertyId = event.pathParameters.id;
    await SuperblockPropertyEntity.delete({ propertyId, name: 'Create UI'});

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Property deleted successfully.' }),
    };
  }

  @RouteAndExec()
  execute(event: any) {
    return event;
  }
}
