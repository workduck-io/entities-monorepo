import { extractUserIdFromToken, extractWorkspaceId } from '@mex/gen-utils';
import { createError } from '@middy/util';
import { ValidatedAPIGatewayProxyHandler } from '@workduck-io/lambda-routing';
import { nanoid } from 'nanoid';
import { getUserInfo, openai } from '../../utils/helpers';
import {
  addDocumentToMeiliSearch,
  deleteDocumentFromMeiliSearch,
  searchDocumentFromMeiliSearch,
  updateDocumentInMeiliSearch,
} from '../../utils/meiliSearchHelper';
import { Gpt3PromptAnalyticsEntity, Gpt3PromptEntity } from '../entities';
import {
  Gpt3Prompt,
  Gpt3PromptAnalytics,
  Gpt3PromptBody,
  MeiliSearchDocumentResponse,
} from '../interface';

export const createPromptHandler: ValidatedAPIGatewayProxyHandler<
  Gpt3Prompt
> = async (event) => {
  const workspaceId = process.env.DEFAULT_WORKSPACE_ID;
  const userId = extractUserIdFromToken(event);
  const gpt3Prompt: Gpt3PromptBody = event.body;

  const payload = {
    userId,
    createdBy: userId,
    downloadedBy: [`${userId}`],
    workspaceId,
    entityId: gpt3Prompt.entityId ?? nanoid(),
    analyticsId: nanoid(),
    version: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...gpt3Prompt,
  };

  try {
    // Lamda invoke for fetching user createdBy data
    const userResponse = await getUserInfo(event);

    const dbRes: Gpt3Prompt = (
      await Gpt3PromptEntity.update(
        { ...payload },
        {
          returnValues: 'ALL_NEW',
        }
      )
    ).Attributes;

    // Analytics entry
    const analyticsRes: Gpt3PromptAnalytics = (
      await Gpt3PromptAnalyticsEntity.update(
        {
          analyticsId: dbRes.analyticsId,
          promptId: dbRes.entityId,
          createdBy: dbRes.createdBy,
          views: 1,
          likes: 1,
          downloads: dbRes.downloadedBy.length,
        },
        {
          returnValues: 'ALL_NEW',
        }
      )
    ).Attributes;

    // Meilisearch entry
    const meilisearchRes: MeiliSearchDocumentResponse =
      await addDocumentToMeiliSearch({
        mid: dbRes.entityId,
        title: dbRes.title,
        description: dbRes.description,
        category: dbRes.category,
        tags: dbRes.tags,
        showcase: dbRes.showcase,
        views: 1,
        likes: 1,
        downloads: 1,
        createdBy: {
          name: userResponse.name,
          email: userResponse.email,
          alias: userResponse.alias,
        },
      });

    // Remove prompt, properities from the response
    const { prompt, properties, downloadedBy, analyticsId, ...rest } = dbRes;

    if (dbRes && analyticsRes && meilisearchRes)
      return {
        statusCode: 200,
        body: JSON.stringify({ ...rest }),
      };
    else throw createError(400, 'Error creating prompt');
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

// Get a list of all prompts
export const getAllPromptsHandler: ValidatedAPIGatewayProxyHandler<
  Gpt3Prompt
> = async (event) => {
  let res;
  const workspaceId = process.env.DEFAULT_WORKSPACE_ID;
  const queryParams = event.queryStringParameters;

  if (queryParams) {
    const { category, tags, isPublic } = event.queryStringParameters as any;
    const filters = [];
    if (category) filters.push({ attr: 'category', eq: category });
    if (tags) filters.push({ attr: 'tags', contains: tags });
    if (isPublic) filters.push({ attr: 'isPublic', eq: isPublic === 'true' });

    try {
      res = (
        await Gpt3PromptEntity.query(workspaceId, {
          beginsWith: 'PROMPT_',
          filters: filters,
        })
      ).Items;
    } catch (e) {
      throw createError(400, JSON.stringify(e.message));
    }
  } else {
    try {
      res = (
        await Gpt3PromptEntity.query(workspaceId, {
          beginsWith: 'PROMPT_',
        })
      ).Items;
    } catch (e) {
      throw createError(400, JSON.stringify(e.message));
    }
  }

  // Remove prompt, properities from the response
  const prompts = res.map((item: any) => {
    const { prompt, properties, downloadedBy, ...rest } = item;
    return rest;
  });

  return {
    statusCode: 200,
    body: JSON.stringify(prompts),
  };
};

// Get thr analytics of a prompt
export const getPromptAnalyticsHandler: ValidatedAPIGatewayProxyHandler<
  Gpt3Prompt
> = async (event) => {
  const promptId = event.pathParameters?.promptId;

  try {
    const response = await Gpt3PromptAnalyticsEntity.query(
      `PROMPT_${promptId}`,
      {
        beginsWith: 'PROMPT_ANALYTICS_',
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify(response.Items[0]),
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

// Get a single prompt
export const getPromptHandler: ValidatedAPIGatewayProxyHandler<
  Gpt3Prompt
> = async (event) => {
  const workspaceId = process.env.DEFAULT_WORKSPACE_ID;
  const { id } = event.pathParameters;
  try {
    const { prompt, properties, downloadedBy, ...rest }: any = (
      await Gpt3PromptEntity.get({
        entityId: id,
        workspaceId,
      })
    ).Item;
    return {
      statusCode: 200,
      body: JSON.stringify(rest),
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
  const gpt3Prompt: Gpt3PromptBody = event.body;

  try {
    const prompRes: Gpt3Prompt = (
      await Gpt3PromptEntity.get({
        entityId: gpt3Prompt.entityId,
        workspaceId,
      })
    ).Item;

    // userId should be the same as the one who created the prompt
    if (userId !== prompRes.createdBy)
      return {
        statusCode: 401,
        body: JSON.stringify('You are not authorized to update this prompt'),
      };
    else {
      // check if prompt changed then empty the showcase
      if (prompRes.prompt !== gpt3Prompt.prompt) {
        const dbRes: Gpt3Prompt = (
          await Gpt3PromptEntity.update(
            {
              entityId: gpt3Prompt.entityId,
              workspaceId,
              userId,
              createdBy: userId,
              version: prompRes.version + 1,
              updatedAt: Date.now(),
              showcase: [],
              ...gpt3Prompt,
            },
            {
              returnValues: 'ALL_NEW',
            }
          )
        ).Attributes;

        // Update meilisearch
        const meilisearchRes: MeiliSearchDocumentResponse =
          await updateDocumentInMeiliSearch({
            mid: dbRes.entityId,
            title: dbRes.title,
            description: dbRes.description,
            category: dbRes.category,
            tags: dbRes.tags,
            showcase: [],
          });

        const { prompt, properties, downloadedBy, analyticsId, ...rest } =
          dbRes;
        return {
          statusCode: 200,
          body: JSON.stringify({ ...rest }),
        };
      } else {
        const dbRes: Gpt3Prompt = (
          await Gpt3PromptEntity.update(
            {
              entityId: gpt3Prompt.entityId,
              workspaceId,
              userId,
              createdBy: userId,
              version: prompRes.version + 1,
              updatedAt: Date.now(),
              ...gpt3Prompt,
            },
            {
              returnValues: 'ALL_NEW',
            }
          )
        ).Attributes;

        // Update meilisearch
        const meilisearchRes: MeiliSearchDocumentResponse =
          await updateDocumentInMeiliSearch({
            mid: dbRes.entityId,
            title: dbRes.title,
            description: dbRes.description,
            category: dbRes.category,
            tags: dbRes.tags,
            showcase: dbRes.showcase,
          });

        const { prompt, properties, downloadedBy, analyticsId, ...rest } =
          dbRes;
        return {
          statusCode: 200,
          body: JSON.stringify({ ...rest }),
        };
      }
    }
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
    const deleteRes = (
      await Gpt3PromptEntity.delete(
        {
          entityId: id,
          workspaceId,
        },
        {
          returnValues: 'ALL_OLD',
        }
      )
    ).Attributes;

    // Delete prompt analytics
    const analyticsRes = (
      await Gpt3PromptAnalyticsEntity.delete(
        {
          analyticsId: deleteRes.analyticsId,
          promptId: id,
        },
        {
          returnValues: 'ALL_OLD',
        }
      )
    ).Attributes;

    // Delete the prompt from MeiliSearch
    const meilisearchRes = await deleteDocumentFromMeiliSearch(id);

    if (deleteRes && analyticsRes && meilisearchRes)
      return {
        statusCode: 200,
        body: JSON.stringify('Prompt deleted successfully'),
      };
    else throw createError(400, JSON.stringify('Error deleting prompt'));
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
    const prompt: Gpt3Prompt = (
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

      // Update analytics
      const analyticsRes = await Gpt3PromptAnalyticsEntity.update(
        {
          analyticsId: res.analyticsId,
          promptId: res.entityId,
          createdBy: res.createdBy,
          downloads: res.downloadedBy.length,
        },
        {
          returnValues: 'ALL_NEW',
        }
      );

      // update meilisearch
      const meilisearchRes = await updateDocumentInMeiliSearch({
        mid: res.entityId,
        downloads: res.downloadedBy.length,
      });

      if (res && analyticsRes && meilisearchRes)
        return {
          statusCode: 200,
          body: JSON.stringify(res),
        };
      else throw createError(400, JSON.stringify('Error downloading prompt'));
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
  const { max_tokens, temperature, weight, iterations } =
    event.body as unknown as Gpt3Prompt['properties'];

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
      top_p: weight ?? properties.top_p,
      n: iterations ?? properties.iterations,
    };

    // Call the GPT3 API
    const completions: any = await openai.createCompletion({
      ...resultPayload,
    });

    // Remove other fields in choices array and return only the text, index
    if (
      completions &&
      completions.data &&
      completions.data.choices.length > 0
    ) {
      let choices = completions.data.choices.map((choice, index) => {
        return {
          index,
          text: choice.text,
        };
      });
      return {
        statusCode: 200,
        body: JSON.stringify(choices),
      };
    } else throw createError(400, JSON.stringify('Error fetching results'));
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

// Search for a prompt
export const searchPromptHandler: ValidatedAPIGatewayProxyHandler<
  Gpt3Prompt
> = async (event) => {
  const { query } = event.queryStringParameters as any;
  try {
    const results = await searchDocumentFromMeiliSearch(query);
    return {
      statusCode: 200,
      body: JSON.stringify(results),
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};
