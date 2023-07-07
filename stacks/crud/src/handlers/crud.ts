import {
  HTTPMethod,
  Route,
  RouteAndExec,
  ValidatedAPIGatewayProxyEvent,
} from '@workduck-io/lambda-routing';
import { createError } from '@middy/util';
import { v4 as uuidv4 } from 'uuid';
import { CrudEntity } from '../entities';
import { Note } from '../interface';

export class CrudHandler {
  @Route({
    method: HTTPMethod.POST,
    path: '/',
  })
  async createNoteHandler(event: ValidatedAPIGatewayProxyEvent<Note>) {
    const { body } = event;
    const newNote: Note = {
      id: uuidv4(),
      name: body.name,
      content: body.content,
    };
    await CrudEntity.update(newNote);
    return {
      statusCode: 200,
      body: JSON.stringify(newNote),
    };
  }
  @Route({
    method: HTTPMethod.GET,
    path: '/{id}',
  })
  async getNoteHandler(event: ValidatedAPIGatewayProxyEvent<Note>) {
    const { pathParameters } = event;
    const { id } = pathParameters;

    const note = await CrudEntity.get({ id, name: "Aryan Shaw"});

    if (!note) {
      throw createError(
        404,
        JSON.stringify({
          statusCode: 404,
          message: 'Note not found',
        })
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify(note),
    };
  }

  @Route({
    method: HTTPMethod.PUT,
    path: '/{id}',
  })
  async updateNoteHandler(event: ValidatedAPIGatewayProxyEvent<Note>) {
    const { body, pathParameters } = event;
    const { id } = pathParameters;

    const existingNoteResponse = await CrudEntity.get({ id, name: "Aryan Shaw" });

    if (!existingNoteResponse.Item) {
      throw createError(
        404,
        JSON.stringify({
          statusCode: 404,
          message: 'Note not found',
        })
      );
    }

    const existingNote = existingNoteResponse.Item;

    const updatedNote: Note = {
      ...existingNote,
      ...body,
    };

    await CrudEntity.put(updatedNote);

    return {
      statusCode: 200,
      body: JSON.stringify(updatedNote),
    };
  }
  @Route({
    method: HTTPMethod.DELETE,
    path: '/{id}',
  })

  async deleteNoteHandler(event: ValidatedAPIGatewayProxyEvent<Note>) {
    const { pathParameters } = event;
    const { id } = pathParameters;

    const existingNoteResponse = await CrudEntity.get({ id, name:"Aryan Shaw" });

    if (!existingNoteResponse.Item) {
      throw createError(
        404,
        JSON.stringify({
          statusCode: 404,
          message: 'Note not found',
        })
      );
    }

    await CrudEntity.delete({ id, name:"Aryan Shaw" });

    return {
      statusCode: 204,
      body: JSON.stringify({
        message: 'Note deleted successfully',
      }),
    };
  }

  @RouteAndExec()
  execute(event) {
    return event;
  }
}
