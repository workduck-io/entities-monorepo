import { extractUserIdFromToken } from '@mex/gen-utils';
import { createError } from '@middy/util';
import { ValidatedAPIGatewayProxyHandler } from '@workduck-io/lambda-routing';
import { nanoid } from 'nanoid';
import { Gpt3PromptShowcaseEntity } from '../entities';

export const createPromptResponseHandler: ValidatedAPIGatewayProxyHandler<
  any
> = async (event) => {
  const body: {
    promptId: string;
    savedResponse: string;
  } = event.body;
  if (!body || !body.promptId || !body.savedResponse) {
    throw createError(
      400,
      'Invalid request: Missing promptId or savedResponse'
    );
  }

  const userId = extractUserIdFromToken(event);
  const resultId = 'RESULT_' + nanoid();

  const payload = {
    userId,
    promptId: body.promptId,
  };

  const exists = (await Gpt3PromptShowcaseEntity.get(payload)).Item;
  if (!exists || !exists.savedResponse) {
    (
      await Gpt3PromptShowcaseEntity.update(
        {
          ...payload,
          savedResponse: {
            [resultId]: body.savedResponse,
          },
        },
        {
          returnValues: 'ALL_NEW',
        }
      )
    ).Attributes;

    return {
      statusCode: 200,
      body: JSON.stringify(resultId),
    };
  } else {
    (
      await Gpt3PromptShowcaseEntity.update(
        {
          ...payload,
          savedResponse: {
            ...exists.savedResponse,
            [resultId]: body.savedResponse,
          },
        },
        {
          returnValues: 'ALL_NEW',
        }
      )
    ).Attributes;

    return {
      statusCode: 200,
      body: JSON.stringify(resultId),
    };
  }
};

export const getPromptResponseHandler: ValidatedAPIGatewayProxyHandler<
  any
> = async (event) => {
  const userId = extractUserIdFromToken(event);
  const promptId = event.pathParameters?.id;

  if (!promptId) {
    throw createError(400, 'Invalid request: Missing promptId');
  }
  const res = (
    await Gpt3PromptShowcaseEntity.get({
      userId,
      promptId,
    })
  ).Item;

  if (res && res.savedResponse) {
    return {
      statusCode: 200,
      body: JSON.stringify(res),
    };
  } else {
    return {
      statusCode: 200,
      body: JSON.stringify({}),
    };
  }
};

export const deletePromptResponseHandler: ValidatedAPIGatewayProxyHandler<
  any
> = async (event) => {
  const userId = extractUserIdFromToken(event);
  const promptId = event.pathParameters?.id;
  const resultId = event.pathParameters?.resultId;

  if (!promptId || !resultId) {
    throw createError(400, 'Invalid request: Missing promptId or resultId');
  }

  const res = (
    await Gpt3PromptShowcaseEntity.get({
      userId,
      promptId,
    })
  ).Item;

  if (res && res.savedResponse) {
    const savedResponse = { ...res.savedResponse };
    if (savedResponse[resultId]) {
      delete savedResponse[resultId];
    } else {
      throw createError(400, 'Response not found');
    }

    const updateRes = (
      await Gpt3PromptShowcaseEntity.update(
        {
          ...res,
          savedResponse,
        },
        {
          returnValues: 'ALL_NEW',
        }
      )
    ).Attributes;

    return {
      statusCode: 204,
    };
  } else {
    throw createError(400, 'Response not found');
  }
};
