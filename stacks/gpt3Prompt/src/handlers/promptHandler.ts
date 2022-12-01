import { extractUserIdFromToken, extractWorkspaceId } from '@mex/gen-utils';
import { createError } from '@middy/util';
import { ValidatedAPIGatewayProxyHandler } from '@workduck-io/lambda-routing';
import { nanoid } from 'nanoid';
import { openai } from '../../utils/helpers';
import { Gpt3PromptEntity } from '../entities';
import { Gpt3Prompt } from '../interface';

export const createPromptHandler: ValidatedAPIGatewayProxyHandler<
  Gpt3Prompt
> = async (event) => {
  const workspaceId = process.env.DEFAULT_WORKSPACE_ID;
  const userId = extractUserIdFromToken(event);
  const gpt3Prompt = event.body;
  const payload = {
    entityId: gpt3Prompt.entityId ?? nanoid(),
    createdBy: userId,
    workspaceId,
    userId,
    version: 0,
    downloadedBy: [`${userId}`],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    _source: 'EXTERNAL',
    ...gpt3Prompt,
  };

  try {
    const res = (
      await Gpt3PromptEntity.update(
        { ...payload },
        {
          returnValues: 'ALL_NEW',
        }
      )
    ).Attributes;
    return {
      statusCode: 200,
      body: JSON.stringify(res),
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

// Get a list of all prompts
export const getAllPromptsHandler: ValidatedAPIGatewayProxyHandler<
  Gpt3Prompt
> = async (event) => {
  const workspaceId = process.env.DEFAULT_WORKSPACE_ID;
  const queryParams = event.queryStringParameters;

  if (queryParams) {
    const { category, tags, isPublic } = event.queryStringParameters as any;
    const filters = [];
    if (category) filters.push({ attr: 'category', eq: category });
    if (tags) filters.push({ attr: 'tags', contains: tags });
    if (isPublic) filters.push({ attr: 'isPublic', eq: isPublic === 'true' });

    try {
      const res = (
        await Gpt3PromptEntity.query(workspaceId, {
          beginsWith: 'PROMPT_',
          filters: filters,
        })
      ).Items;
      return {
        statusCode: 200,
        body: JSON.stringify(res),
      };
    } catch (e) {
      throw createError(400, JSON.stringify(e.message));
    }
  } else {
    try {
      const res = (
        await Gpt3PromptEntity.query(workspaceId, {
          beginsWith: 'PROMPT_',
        })
      ).Items;
      return {
        statusCode: 200,
        body: JSON.stringify(res),
      };
    } catch (e) {
      throw createError(400, JSON.stringify(e.message));
    }
  }
};

// Get a single prompt
export const getPromptHandler: ValidatedAPIGatewayProxyHandler<
  Gpt3Prompt
> = async (event) => {
  const workspaceId = process.env.DEFAULT_WORKSPACE_ID;
  const { id } = event.pathParameters;
  try {
    const res = (
      await Gpt3PromptEntity.get({
        entityId: id,
        workspaceId,
      })
    ).Item;
    return {
      statusCode: 200,
      body: JSON.stringify(res),
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

// Update a prompt
export const updatePromptHandler: ValidatedAPIGatewayProxyHandler<
  Gpt3Prompt
> = async (event) => {
  const workspaceId = extractWorkspaceId(event);
  const userId = extractUserIdFromToken(event);
  const gpt3Prompt = event.body;
  const { id } = event.pathParameters;

  const payload = {
    entityId: id,
    updatedAt: Date.now(),
    createdBy: userId,
    workspaceId,
    userId,
  };
  console.log('payload', payload);

  try {
    const res = (
      await Gpt3PromptEntity.update(
        { ...payload, ...gpt3Prompt },
        {
          returnValues: 'ALL_NEW',
        }
        // {
        //   UpdateExpression: 'set version = version + :num',
        //   ExpressionAttributeValues: {
        //     ':num': 1,
        //   },
        //   ExpressionAttributeNames: {
        //     '#version': 'version',
        //   },
        //   ReturnValues: 'ALL_NEW',
        // }
      )
    ).Attributes;

    return {
      statusCode: 200,
      body: JSON.stringify(res),
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

// Delete a prompt
export const deletePromptHandler: ValidatedAPIGatewayProxyHandler<
  Gpt3Prompt
> = async (event) => {
  const workspaceId = process.env.DEFAULT_WORKSPACE_ID;
  const { id } = event.pathParameters;
  try {
    const res = await Gpt3PromptEntity.delete({
      entityId: id,
      workspaceId,
    });
    return {
      statusCode: 200,
      body: JSON.stringify(res),
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

// Download a prompt for the user
export const downloadPromptHandler: ValidatedAPIGatewayProxyHandler<
  Gpt3Prompt
> = async (event) => {
  const workspaceId = process.env.DEFAULT_WORKSPACE_ID;
  const userId = extractUserIdFromToken(event);
  const { id } = event.pathParameters;

  const payload = {
    entityId: id,
    workspaceId,
  };
  try {
    const prompt: any = (
      await Gpt3PromptEntity.get({
        ...payload,
      })
    ).Item;

    // Append the user id to the prompt dewndloadBy array and if already present, then return already downloaded
    if (prompt.downloadedBy && prompt.downloadedBy.includes(userId)) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Already downloaded',
        }),
      };
    } else {
      prompt.downloadedBy.push(userId);
      const res = (
        await Gpt3PromptEntity.update(
          { ...payload, ...prompt },
          {
            returnValues: 'ALL_NEW',
          }
        )
      ).Attributes;
      return {
        statusCode: 200,
        body: JSON.stringify(res),
      };
    }
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

// Results of a prompt
export const resultPrompthandler: ValidatedAPIGatewayProxyHandler<
  Gpt3Prompt
> = async (event) => {
  const workspaceId = process.env.DEFAULT_WORKSPACE_ID;
  const { id } = event.pathParameters;
  const { max_tokens, temperature, top_p, n } = event.body as any;

  // Get the prompt
  try {
    const promptRes: any = (
      await Gpt3PromptEntity.get({
        entityId: id,
        workspaceId,
      })
    ).Item;

    const { prompt, properties } = promptRes;
    const resultPayload = {
      prompt: prompt,
      model: properties.model,
      max_tokens: max_tokens ?? properties.max_tokens,
      temperature: temperature ?? properties.temperature,
      top_p: top_p ?? properties.top_p,
      n: n ?? properties.iterations,
    };

    // Call the GPT3 API
    const completion = await openai.createCompletion({
      ...resultPayload,
    });

    // Remove other fields in choices array and return only the text, index
    const choices = completion.data.choices.map((choice, index) => {
      return {
        text: choice.text,
        index,
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify(choices),
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

// Get all prompts dwonloaded by the user
export const getAllUserPromptsHandler: ValidatedAPIGatewayProxyHandler<
  Gpt3Prompt
> = async (event) => {
  const workspaceId = process.env.DEFAULT_WORKSPACE_ID;
  const userId = extractUserIdFromToken(event);

  try {
    const downloadedRes = (
      await Gpt3PromptEntity.query(workspaceId, {
        beginsWith: 'PROMPT_',
        // @ts-ignore
        filters: [{ attr: 'downloadedBy', contains: userId }],
      })
    ).Items;

    const createdRes = (
      await Gpt3PromptEntity.query(workspaceId, {
        beginsWith: 'PROMPT_',
        // @ts-ignore
        filters: [{ attr: 'createdBy', eq: userId }],
      })
    ).Items;

    // if promptId is present in createdRes, then remove it from downloadedRes
    const res = downloadedRes.filter((prompt: any) => {
      return !createdRes.find((createdPrompt: any) => {
        return createdPrompt.entityId === prompt.entityId;
      });
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        downloaded: res,
        created: createdRes,
      }),
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

// Sort all prompts based on the views, downloads, likes, recentlty created
export const sortPromptsHandler: ValidatedAPIGatewayProxyHandler<
  Gpt3Prompt
> = async (event) => {
  const workspaceId = process.env.DEFAULT_WORKSPACE_ID;
  const { sortBy } = event.queryStringParameters as any;

  try {
    const res = (
      await Gpt3PromptEntity.query(workspaceId, {
        beginsWith: 'PROMPT_',
      })
    ).Items;

    // if sortBy is downloads, then sort by downloadedBy array length
    if (sortBy === 'downloads') {
      res.sort((a: any, b: any) => {
        return b.downloadedBy.length - a.downloadedBy.length;
      });
    } else {
      res.sort((a: any, b: any) => {
        return b[sortBy] - a[sortBy];
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify(res),
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};
