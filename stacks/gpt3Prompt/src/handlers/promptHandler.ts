import { extractUserIdFromToken, extractWorkspaceId } from '@mex/gen-utils';
import { createError } from '@middy/util';
import { ValidatedAPIGatewayProxyHandler } from '@workduck-io/lambda-routing';
import { nanoid } from 'nanoid';
import { getUserInfo, openai, replaceVarWithVal } from '../../utils/helpers';
import {
  addDocumentToMeiliSearch,
  deleteDocumentFromMeiliSearch,
  getAllDocuments,
  searchDocumentFromMeiliSearch,
  sortFromMeiliSearch,
  updateDocumentInMeiliSearch,
} from '../../utils/meiliSearchHelper';
import { Gpt3PromptAnalyticsEntity, Gpt3PromptEntity } from '../entities';
import {
  Gpt3Prompt,
  Gpt3PromptBody,
  MeiliSearchDocumentResponse,
  PromptDownloadState,
  SortKey,
  SortOrder,
} from '../interface';

import { Categories } from 'stacks/gpt3Prompt/utils/consts';

export const createPromptHandler: ValidatedAPIGatewayProxyHandler<
  Gpt3Prompt
> = async (event) => {
  const workspaceId = process.env.DEFAULT_WORKSPACE_ID;
  const userId = extractUserIdFromToken(event);
  const gpt3Prompt: Gpt3PromptBody = event.body;

  const payload = {
    userId,
    createdBy: userId,
    workspaceId,
    entityId: gpt3Prompt.entityId ?? nanoid(),
    downloadedBy: [],
    analyticsId: nanoid(),
    version: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    properties: gpt3Prompt.properties ?? {
      model: 'text-davinci-002',
      max_tokens: 250,
      temperature: 0.7,
      iterations: 3,
    },
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
    ).Attributes as Gpt3Prompt;

    // Analytics entry
    const analyticsRes: any = (
      await Gpt3PromptAnalyticsEntity.update(
        {
          analyticsId: dbRes.analyticsId,
          promptId: dbRes.entityId,
          createdBy: dbRes.createdBy,
          views: [`${dbRes.userId}`],
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
        views: analyticsRes.views ? analyticsRes.views.length : 0,
        likes: analyticsRes.likes ? analyticsRes.likes.length : 0,
        downloads: analyticsRes.downloadedBy
          ? analyticsRes.downloadedBy.length
          : 0,
        createdBy: {
          id: userResponse.id,
          name: userResponse.name,
          email: userResponse.email,
          alias: userResponse.alias,
        },
        createdAt: dbRes.createdAt,
        updatedAt: dbRes.updatedAt,
        imageUrls: dbRes.imageUrls,
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

// Get the analytics of a prompt
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
    const { prompt, properties, downloadedBy, analyticsId, ...rest }: any = (
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
    ).Item as Gpt3Prompt;

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
        ).Attributes as Gpt3Prompt;

        // Update meilisearch
        const meilisearchRes: MeiliSearchDocumentResponse =
          await updateDocumentInMeiliSearch({
            mid: dbRes.entityId,
            title: dbRes.title,
            description: dbRes.description,
            category: dbRes.category,
            tags: dbRes.tags,
            showcase: [],
            createdAt: dbRes.createdAt,
            updatedAt: dbRes.updatedAt,
            imageUrl: dbRes.imageUrls,
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
        ).Attributes as Gpt3Prompt;

        // Update meilisearch
        const meilisearchRes: MeiliSearchDocumentResponse =
          await updateDocumentInMeiliSearch({
            mid: dbRes.entityId,
            title: dbRes.title,
            description: dbRes.description,
            category: dbRes.category,
            tags: dbRes.tags,
            showcase: dbRes.showcase,
            createdAt: dbRes.createdAt,
            updatedAt: dbRes.updatedAt,
            imageUrl: dbRes.imageUrls,
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
    const dbRes: Gpt3Prompt = (
      await Gpt3PromptEntity.get({
        ...payload,
      })
    ).Item as Gpt3Prompt;

    // Append the user id to the prompt dewndloadBy array and if already present, then return already downloaded
    if (dbRes.downloadedBy && dbRes.downloadedBy.includes(userId))
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: PromptDownloadState.DOWNLOADED,
        }),
      };
    // if userId is same as createdBy then return already downloaded
    else if (dbRes.createdBy === userId)
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: PromptDownloadState.USER_CREATED,
        }),
      };
    // if dbRes.downloadedBy is undefined then set it to an array with the userId
    else if (
      !dbRes.downloadedBy ||
      dbRes.downloadedBy === undefined ||
      dbRes.downloadedBy === null ||
      (Array.isArray(dbRes.downloadedBy) && dbRes.downloadedBy.length === 0)
    )
      dbRes.downloadedBy = [userId];
    else dbRes.downloadedBy.push(userId);

    const res: Gpt3Prompt = (
      await Gpt3PromptEntity.update(
        { ...payload, ...dbRes },
        {
          returnValues: 'ALL_NEW',
        }
      )
    ).Attributes as Gpt3Prompt;

    // Update analytics
    const analyticsRes = await Gpt3PromptAnalyticsEntity.update(
      {
        analyticsId: res.analyticsId,
        promptId: res.entityId,
        createdBy: res.createdBy,
        downloadedBy: res.downloadedBy,
      },
      {
        returnValues: 'ALL_NEW',
      }
    );

    // update meilisearch
    const meilisearchRes = await updateDocumentInMeiliSearch({
      mid: res.entityId,
      updatedAt: res.updatedAt,
      downloads: res.downloadedBy ? res.downloadedBy.length : 0,
    });

    // Remove prompt, properities from the response
    const { prompt, properties, analyticsId, ...rest } = res;
    if (res && analyticsRes && meilisearchRes)
      return {
        statusCode: 200,
        body: JSON.stringify({ ...rest }),
      };
    else throw createError(400, JSON.stringify('Error downloading prompt'));
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

  const { options, variablesValues } = event.body as unknown as {
    options: Gpt3Prompt['properties'];
    variablesValues: Record<string, string>;
  };

  // const { max_tokens, temperature, weight, iterations } =
  //   event.body as unknown as Gpt3Prompt['properties'];

  // Get the prompt
  try {
    const promptRes: any = (
      await Gpt3PromptEntity.get({
        entityId: id,
        workspaceId,
      })
    ).Item;

    const { prompt, properties, variables } = promptRes;

    // Replace the variables with the values
    const transformedPrompt = replaceVarWithVal(
      prompt,
      variables,
      variablesValues
    );

    if (transformedPrompt) {
      const resultPayload = {
        prompt: transformedPrompt,
        model: properties.model,
        max_tokens: options.max_tokens ?? properties.max_tokens,
        temperature: options.temperature ?? properties.temperature,
        top_p: options.weight ?? properties.top_p,
        n: options.iterations ?? properties.iterations,
      };

      // Call the GPT3 API
      let completions;
      try {
        completions = await openai.createCompletion({
          ...resultPayload,
        });
      } catch (error) {
        throw createError(400, JSON.stringify(error.message));
      }

      // Remove other fields in choices array and return only the text, index
      if (
        completions &&
        completions.data &&
        completions.data.choices.length > 0
      ) {
        let choices = [];
        completions.data.choices.map((choice) => {
          return choices.push(choice.text);
        });
        return {
          statusCode: 200,
          body: JSON.stringify(choices),
        };
      } else throw createError(400, JSON.stringify('Error fetching results'));
    }
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

export const getAllPublicUserPromptsHandler: ValidatedAPIGatewayProxyHandler<
  Gpt3Prompt
> = async (event) => {
  const workspaceId = process.env.DEFAULT_WORKSPACE_ID;
  const queryParams = event.queryStringParameters;
  const userId = queryParams?.userId as string;

  let downloadedRes, createdRes;
  try {
    if (userId) {
      downloadedRes = (
        await Gpt3PromptEntity.query(workspaceId, {
          beginsWith: 'PROMPT_',
          // @ts-ignore
          filters: [{ attr: 'downloadedBy', contains: userId }],
        })
      ).Items;

      createdRes = (
        await Gpt3PromptEntity.query(workspaceId, {
          beginsWith: 'PROMPT_',
          // @ts-ignore
          filters: [
            { attr: 'createdBy', eq: userId },
            { attr: 'isPublic', eq: true },
          ],
        })
      ).Items;
    }

    const downloadedResFiltered = downloadedRes.map((downloadedPrompt: any) => {
      const { prompt, properties, downloadedBy, analyticsId, ...rest } =
        downloadedPrompt;
      return rest;
    });

    const createdResFiltered = createdRes.map((createdPrompt: any) => {
      const { prompt, properties, downloadedBy, analyticsId, ...rest } =
        createdPrompt;
      return rest;
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        downloaded: downloadedResFiltered,
        created: createdResFiltered,
      }),
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
  const currentUserId = extractUserIdFromToken(event);

  let downloadedRes, createdRes;
  try {
    downloadedRes = (
      await Gpt3PromptEntity.query(workspaceId, {
        beginsWith: 'PROMPT_',
        // @ts-ignore
        filters: [{ attr: 'downloadedBy', contains: currentUserId }],
      })
    ).Items;

    createdRes = (
      await Gpt3PromptEntity.query(workspaceId, {
        beginsWith: 'PROMPT_',
        // @ts-ignore
        filters: [{ attr: 'createdBy', eq: currentUserId }],
      })
    ).Items;

    const downloadedResFiltered = downloadedRes.map((downloadedPrompt: any) => {
      const { prompt, properties, downloadedBy, analyticsId, ...rest } =
        downloadedPrompt;
      return rest;
    });

    const createdResFiltered = createdRes.map((createdPrompt: any) => {
      const { prompt, properties, downloadedBy, analyticsId, ...rest } =
        createdPrompt;
      return rest;
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        downloaded: downloadedResFiltered,
        created: createdResFiltered,
      }),
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

// Search for a prompt
export const searchPromptHandler: ValidatedAPIGatewayProxyHandler<
  Gpt3Prompt
> = async (event) => {
  const { query, filters, sort, limit } = event.body as any;

  try {
    const results = await searchDocumentFromMeiliSearch(
      query,
      filters,
      sort,
      limit
    );
    return {
      statusCode: 200,
      body: JSON.stringify(results),
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

// Liked/Unliked, View/Unview for the prompt
export const likedViewedPromptHandler: ValidatedAPIGatewayProxyHandler<
  Gpt3Prompt
> = async (event) => {
  const { id } = event.pathParameters;
  const userId = extractUserIdFromToken(event);
  // allow likes, views one time per user
  const { likes, views } = event.queryStringParameters as any;

  try {
    // Get analytics
    const analyticsRes: any = (
      await Gpt3PromptAnalyticsEntity.query(`PROMPT_${id}`, {
        beginsWith: 'PROMPT_ANALYTICS_',
      })
    ).Items[0];

    // If userId is present in likes array, then return already liked else add it
    switch (likes) {
      case 'true':
        if (analyticsRes.likes && analyticsRes.likes.includes(userId))
          return {
            statusCode: 200,
            body: JSON.stringify("You've already liked this prompt"),
          };
        else if (
          !analyticsRes.likes ||
          analyticsRes.likes === undefined ||
          analyticsRes.likes === null ||
          (Array.isArray(analyticsRes.likes) && analyticsRes.likes.length === 0)
        ) {
          analyticsRes.likes = [userId];
        } else analyticsRes.likes.push(userId);

        break;
      case 'false':
        if (analyticsRes.likes.includes(userId)) {
          analyticsRes.likes = analyticsRes.likes.filter(
            (like) => like !== userId
          );
        } else
          return {
            statusCode: 200,
            body: JSON.stringify("You've already unliked this prompt"),
          };

        break;
    }

    // switch case for views
    switch (views) {
      case 'true':
        if (analyticsRes.views.includes(userId))
          return {
            statusCode: 200,
            body: JSON.stringify("You've already viewed this prompt"),
          };
        else analyticsRes.views.push(userId);

        break;
      case 'false':
        if (analyticsRes.views.includes(userId))
          analyticsRes.views = analyticsRes.views.filter(
            (view) => view !== userId
          );
        else
          return {
            statusCode: 200,
            body: JSON.stringify("You've already unviewed this prompt"),
          };

        break;
    }

    const analyticsUpdateRes: any = (
      await Gpt3PromptAnalyticsEntity.update(
        {
          analyticsId: analyticsRes.analyticsId,
          promptId: analyticsRes.promptId,
          createdBy: analyticsRes.createdBy,
          views: analyticsRes.views,
          likes: analyticsRes.likes,
        },
        {
          returnValues: 'ALL_NEW',
        }
      )
    ).Attributes;

    // Update MeiliSearch document
    const updateMeiliSearchRes = await updateDocumentInMeiliSearch({
      mid: analyticsUpdateRes.promptId,
      likes: analyticsUpdateRes.likes ? analyticsUpdateRes.likes.length : 0,
      views: analyticsUpdateRes.views ? analyticsUpdateRes.views.length : 0,
    });

    if (analyticsUpdateRes && updateMeiliSearchRes) {
      return {
        statusCode: 200,
        body: JSON.stringify(analyticsUpdateRes),
      };
    } else throw createError(400, JSON.stringify('Error updating prompt'));
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

// Get all categories for the prompt
export const getCategoriesHandler: ValidatedAPIGatewayProxyHandler<
  Gpt3Prompt
> = async (event) => {
  const categories = {
    id: 1,
    title: 'Categories',
    content: Categories,
  };

  return {
    statusCode: 200,
    body: JSON.stringify(categories),
  };
};

// Home Page Dashboard for the prompt
// Today's Prompt - Get the prompt with the latest createdAt within the last 24 hours
// Most Downloaded Prompt - Get the prompt with the most downloads
// Popular Weekly Prompt - Get the prompt with the most views within the last 7 days
// Trending Prompts - Get the prompt with the weighted score of likes, views and downloads in descending order
// Weighted Score = (likes * 1) + (views * 0.5) + (downloads * 0.25)
export const homeDashboardHandler: ValidatedAPIGatewayProxyHandler<
  Gpt3Prompt
> = async (event) => {
  const userId = extractUserIdFromToken(event);
  let homePrompts: any = {
    todayPrompts: {
      title: `Today's Pick`,
      content: [],
    },
    mostDownloadedPrompts: {
      title: 'Most Downloaded',
      content: [],
    },
    popularWeeklyPrompts: {
      title: 'Popular Weekly',
      content: [],
    },
    trendingPrompts: {
      title: 'Trending Prompts',
      content: [],
    },
    userRecentPrompts: {
      title: 'Your Recent Prompts',
      content: [],
    },
  };

  let currentTime = Date.now();
  let last24Hours = currentTime - 24 * 60 * 60 * 1000;
  let last7Days = currentTime - 7 * 24 * 60 * 60 * 1000;
  let filter24H = `${SortKey.CREATED_AT} >= ${last24Hours} AND ${SortKey.CREATED_AT} <= ${currentTime}`;
  let filter7D = `${SortKey.CREATED_AT} >= ${last7Days} AND ${SortKey.CREATED_AT} <= ${currentTime}`;
  let filterUser = `createdBy.id = ${userId}`;

  // Make parallel requests for todayPrompts, mostDownloadedPrompts, popularWeeklyPrompts and trendingPrompts
  const [
    getAllPrompts,
    mostDownloadedPrompts,
    popularWeeklyPrompts,
    todayPrompts,
    userRecentPrompts,
  ]: any = await Promise.all([
    getAllDocuments(),
    sortFromMeiliSearch(SortKey.DOWNLOADS, SortOrder.DESC),
    sortFromMeiliSearch(SortKey.VIEWS, SortOrder.DESC, filter7D, 20),
    sortFromMeiliSearch(SortKey.CREATED_AT, SortOrder.DESC, filter24H, 20),
    sortFromMeiliSearch(SortKey.CREATED_AT, SortOrder.DESC, filterUser, 20),
  ]);

  homePrompts.todayPrompts.content = todayPrompts;
  homePrompts.mostDownloadedPrompts.content = mostDownloadedPrompts;
  homePrompts.popularWeeklyPrompts.content = popularWeeklyPrompts;
  homePrompts.userRecentPrompts.content = userRecentPrompts;

  let weightedScore = getAllPrompts.map((prompt: any) => {
    let score = prompt.likes * 1 + prompt.views * 0.5 + prompt.downloads * 0.25;
    return {
      ...prompt,
      score,
    };
  });

  // Sort the prompts based on the weighted score
  homePrompts.trendingPrompts.content = weightedScore.sort(
    (a: any, b: any) => b.score - a.score
  );

  try {
    return {
      statusCode: 200,
      body: JSON.stringify(homePrompts),
    };
  } catch (error) {
    throw createError(400, JSON.stringify(error.message));
  }
};
