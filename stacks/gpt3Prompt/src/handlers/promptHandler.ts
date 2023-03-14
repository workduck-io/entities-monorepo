import {
  extractUserIdFromToken,
  extractWorkspaceId,
  InternalError,
} from '@mex/gen-utils';
import { createError } from '@middy/util';
import {
  HTTPMethod,
  Route,
  RouteAndExec,
  ValidatedAPIGatewayProxyEvent,
} from '@workduck-io/lambda-routing';
import { nanoid } from 'nanoid';
import {
  getUserInfo,
  openaiInstance,
  pickAttributes,
  removeAtrributes,
  replaceVarWithVal,
  replaceVarWithValForPreview,
} from '../../utils/helpers';
import {
  addDocumentToMeiliSearch,
  deleteDocumentFromMeiliSearch,
  getAllDocuments,
  searchDocumentFromMeiliSearch,
  sortFromMeiliSearch,
  updateDocumentInMeiliSearch,
} from '../../utils/meiliSearchHelper';
import {
  Gpt3PromptAnalyticsEntity,
  Gpt3PromptEntity,
  Gpt3PromptShowcaseEntity,
  Gpt3PromptUserEntity,
} from '../entities';
import {
  Gpt3Prompt,
  Gpt3PromptBody,
  MeiliSearchDocumentResponse,
  PromptDownloadState,
  SortKey,
  SortOrder,
  UserApiInfo,
} from '../interface';

import {
  Categories,
  defaultGPT3Props,
  PromptProviders,
} from '../../utils/consts';

@InternalError()
export class PromtHandlersHandler {
  @Route({
    method: HTTPMethod.POST,
    path: '/',
  })
  async createHandler(event: ValidatedAPIGatewayProxyEvent<Gpt3Prompt>) {
    const workspaceId = process.env.DEFAULT_WORKSPACE_ID;
    const userId = extractUserIdFromToken(event);
    const gpt3Prompt: Gpt3PromptBody = event.body;

    const payload = {
      ...gpt3Prompt,
      userId,
      createdBy: userId,
      workspaceId,
      entityId: gpt3Prompt.entityId ?? nanoid(),
      prompt: gpt3Prompt.prompt + '. Generate results in markdown',
      downloadedBy: [],
      analyticsId: nanoid(),
      version: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      properties: gpt3Prompt.properties ?? defaultGPT3Props,
      default: gpt3Prompt.default ?? false,
    };

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
        ...pickAttributes(dbRes, [
          'title',
          'description',
          'category',
          'tags',
          'showcase',
          'createdAt',
          'updatedAt',
          'imageUrls',
        ]),
        createdBy: {
          ...pickAttributes(userResponse, ['id', 'name', 'email', 'alias']),
        },
        mid: dbRes.entityId,
        views: analyticsRes.views ? analyticsRes.views.length : 0,
        likes: analyticsRes.likes ? analyticsRes.likes.length : 0,
        downloads: analyticsRes.downloadedBy
          ? analyticsRes.downloadedBy.length
          : 0,
      });

    // Remove prompt, properities from the response
    const { prompt, properties, downloadedBy, analyticsId, ...rest } = dbRes;

    if (dbRes && analyticsRes && meilisearchRes)
      return {
        statusCode: 200,
        body: JSON.stringify({ ...rest }),
      };
    else throw createError(400, 'Error creating prompt');
  }

  // Get a list of all prompts
  @Route({
    method: HTTPMethod.POST,
    path: '/all',
  })
  async getAllPromptsHandler(event: ValidatedAPIGatewayProxyEvent<Gpt3Prompt>) {
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
        throw createError(400, e.message);
      }
    } else {
      try {
        res = (
          await Gpt3PromptEntity.query(workspaceId, {
            beginsWith: 'PROMPT_',
          })
        ).Items;
      } catch (e) {
        throw createError(400, e.message);
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
  }

  // Get a single prompt
  @Route({
    method: HTTPMethod.GET,
    path: '/{id}',
  })
  async getPromptHandler(event: ValidatedAPIGatewayProxyEvent<Gpt3Prompt>) {
    const workspaceId = process.env.DEFAULT_WORKSPACE_ID;
    const { id } = event.pathParameters;
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
  }

  // Update a prompt
  @Route({
    method: HTTPMethod.PUT,
    path: '/',
  })
  async updatePromptHandler(event: ValidatedAPIGatewayProxyEvent<Gpt3Prompt>) {
    const workspaceId = extractWorkspaceId(event);
    const userId = extractUserIdFromToken(event);
    const gpt3Prompt: Gpt3PromptBody = event.body;

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
            ...pickAttributes(dbRes, [
              'title',
              'description',
              'category',
              'tags',
              'createdAt',
              'updatedAt',
              'imageUrls',
            ]),
            mid: dbRes.entityId,
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
        ).Attributes as Gpt3Prompt;

        // Update meilisearch
        const meilisearchRes: MeiliSearchDocumentResponse =
          await updateDocumentInMeiliSearch({
            ...pickAttributes(dbRes, [
              'title',
              'description',
              'category',
              'tags',
              'showcase',
              'createdAt',
              'updatedAt',
              'imageUrls',
            ]),
            mid: dbRes.entityId,
          });

        const { prompt, properties, downloadedBy, analyticsId, ...rest } =
          dbRes;
        return {
          statusCode: 200,
          body: JSON.stringify({ ...rest }),
        };
      }
    }
  }

  // Delete a prompt
  @Route({
    method: HTTPMethod.DELETE,
    path: '/{id}',
  })
  async deletePromptHandler(event: ValidatedAPIGatewayProxyEvent<Gpt3Prompt>) {
    const workspaceId = process.env.DEFAULT_WORKSPACE_ID;
    const { id } = event.pathParameters;
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
    else throw createError(400, 'Error deleting prompt');
  }

  // Download a prompt for the user
  @Route({
    method: HTTPMethod.PUT,
    path: '/download/{id}',
  })
  async downloadPromptHandler(
    event: ValidatedAPIGatewayProxyEvent<Gpt3Prompt>
  ) {
    const workspaceId = process.env.DEFAULT_WORKSPACE_ID;
    const userId = extractUserIdFromToken(event);
    const { id } = event.pathParameters;

    const payload = {
      entityId: id,
      workspaceId,
    };

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
    else throw createError(400, 'Error downloading prompt');
  }

  // Results of a prompt
  @Route({
    method: HTTPMethod.POST,
    path: '/result/{id}',
  })
  async resultPrompthandler(event: ValidatedAPIGatewayProxyEvent<any>) {
    const workspaceId = process.env.DEFAULT_WORKSPACE_ID;
    const userId = extractUserIdFromToken(event);
    const { id } = event.pathParameters;
    let options: Gpt3Prompt['properties'],
      variablesValues: Record<string, string>,
      promptRes,
      transformedPrompt;
    let properties = null;

    if (id === 'preview') {
      const body = event.body as any;
      const { prompt, variables } = event.body;
      options = body.options;
      transformedPrompt = replaceVarWithValForPreview(prompt, variables);
    } else {
      options = event.body.options;
      variablesValues = event.body.variablesValues as unknown as Record<
        string,
        string
      >;

      promptRes = (
        await Gpt3PromptEntity.get({
          entityId: id,
          workspaceId,
        })
      ).Item;
      const { prompt, variables } = promptRes;
      properties = promptRes.properties;

      // Replace the variables with the values
      transformedPrompt = replaceVarWithVal(prompt, variables, variablesValues);
    }

    const userAuthInfo: UserApiInfo = (
      await Gpt3PromptUserEntity.get({
        userId,
        workspaceId,
      })
    ).Item as UserApiInfo;

    let apikey: string = '';
    let userFlag: boolean = false;
    let userToken = userAuthInfo.auth?.authData.accessToken;

    if (userToken !== undefined && userToken !== null && userToken !== '') {
      apikey = userAuthInfo.auth?.authData.accessToken;
      userFlag = true;
    } else {
      // If the user has not set the access token, then use the default one with check for the limit
      if (userAuthInfo.auth?.authMetadata.limit > 0) {
        apikey = process.env.OPENAI_API_KEY;
      } else if (userAuthInfo.auth?.authMetadata.limit <= 0) {
        return {
          statusCode: 402,
          body: JSON.stringify("You've reached your limit for the month"),
        };
      } else {
        return {
          statusCode: 402,
          body: JSON.stringify('You need to set up your OpenAI API key'),
        };
      }
    }

    if (transformedPrompt) {
      const resultPayload = {
        prompt: transformedPrompt,
        model: properties ? properties.model : defaultGPT3Props.model,
        max_tokens: options
          ? options.max_tokens
          : properties
          ? properties.max_tokens
          : defaultGPT3Props.max_tokens,
        temperature: options
          ? options.temperature
          : properties
          ? properties.temperature
          : defaultGPT3Props.temperature,
        top_p: options
          ? options.weight
          : properties
          ? properties.top_p
          : defaultGPT3Props.top_p,
        n: options
          ? options.iterations
          : properties
          ? properties.iterations
          : defaultGPT3Props.iterations,
      };

      // Call the GPT3 API
      let completions;
      try {
        completions = await openaiInstance(apikey).createCompletion({
          ...resultPayload,
        });
      } catch (error) {
        throw createError(400, error.response.statusText);
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

        await Gpt3PromptUserEntity.update({
          userId,
          workspaceId,
          auth: {
            authData: userAuthInfo.auth?.authData,
            authMetadata: {
              ...userAuthInfo.auth?.authMetadata,
              limit: userFlag
                ? userAuthInfo.auth?.authMetadata.limit
                : userAuthInfo.auth?.authMetadata.limit === 0
                ? 0
                : userAuthInfo.auth?.authMetadata.limit - 1,
              usage: userAuthInfo.auth?.authMetadata.usage + 1,
            },
          },
        });

        return {
          statusCode: 200,
          body: JSON.stringify(choices),
        };
      } else throw createError(400, 'Error fetching results');
    }
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/allPublicUser',
  })
  async getAllPublicUserPromptsHandler(
    event: ValidatedAPIGatewayProxyEvent<Gpt3Prompt>
  ) {
    const workspaceId = process.env.DEFAULT_WORKSPACE_ID;
    const queryParams = event.queryStringParameters;
    const userId = queryParams?.userId as string;

    let downloadedRes, createdRes;
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
  }

  // Get all prompts dwonloaded by the user
  @Route({
    method: HTTPMethod.GET,
    path: '/allUser',
  })
  async getAllUserPromptsHandler(
    event: ValidatedAPIGatewayProxyEvent<Gpt3Prompt>
  ) {
    const workspaceId = process.env.DEFAULT_WORKSPACE_ID;
    const currentUserId = extractUserIdFromToken(event);

    let downloadedRes, createdRes, defaultRes;
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

    defaultRes = (
      await Gpt3PromptEntity.query(workspaceId, {
        beginsWith: 'PROMPT_',
        // @ts-ignore
        filters: [{ attr: 'default', eq: true }],
      })
    ).Items;

    const removeAtrribute = [
      'prompt',
      'properties',
      'downloadedBy',
      'analyticsId',
      'workspaceId',
    ];

    const downloadedResFiltered = removeAtrributes(
      downloadedRes,
      removeAtrribute
    );
    const createdResFiltered = removeAtrributes(createdRes, removeAtrribute);
    const defaultResFiltered = removeAtrributes(defaultRes, removeAtrribute);

    return {
      statusCode: 200,
      body: JSON.stringify({
        downloaded: downloadedResFiltered,
        created: createdResFiltered,
        default: defaultResFiltered,
      }),
    };
  }

  // Get all prompts provider
  @Route({
    method: HTTPMethod.GET,
    path: '/providers',
  })
  async getAllPromptsProviderHandler(
    event: ValidatedAPIGatewayProxyEvent<Gpt3Prompt>
  ) {
    const providers = PromptProviders;
    return {
      statusCode: 200,
      body: JSON.stringify(providers),
    };
  }

  // Get the analytics of a prompt
  @Route({
    method: HTTPMethod.GET,
    path: '/analytics/{promptId}',
  })
  async getPromptAnalyticsHandler(
    event: ValidatedAPIGatewayProxyEvent<Gpt3Prompt>
  ) {
    const promptId = event.pathParameters?.promptId;
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
  }

  // Get all categories for the prompt
  @Route({
    method: HTTPMethod.GET,
    path: '/allCategories',
  })
  async getCategoriesHandler(event: ValidatedAPIGatewayProxyEvent<Gpt3Prompt>) {
    const categories = {
      id: 1,
      title: 'Categories',
      content: Categories,
    };

    return {
      statusCode: 200,
      body: JSON.stringify(categories),
    };
  }

  // Liked/Unliked, View/Unview for the prompt
  @Route({
    method: HTTPMethod.POST,
    path: '/extra/{id}',
  })
  async likedViewedPromptHandler(
    event: ValidatedAPIGatewayProxyEvent<Gpt3Prompt>
  ) {
    const { id } = event.pathParameters;
    const userId = extractUserIdFromToken(event);
    // allow likes, views one time per user
    const { likes, views } = event.queryStringParameters as any;

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
          ...pickAttributes(analyticsRes, [
            'analyticsId',
            'promptId',
            'createdBy',
            'views',
            'likes',
          ]),
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
    } else throw createError(400, 'Error updating prompt');
  }

  // Home Page Dashboard for the prompt
  // Today's Prompt - Get the prompt with the latest createdAt within the last 24 hours
  // Most Downloaded Prompt - Get the prompt with the most downloads
  // Popular Weekly Prompt - Get the prompt with the most views within the last 7 days
  // Trending Prompts - Get the prompt with the weighted score of likes, views and downloads in descending order
  // Weighted Score = (likes * 1) + (views * 0.5) + (downloads * 0.25)
  @Route({
    method: HTTPMethod.GET,
    path: '/home',
  })
  async homeDashboardHandler(event: ValidatedAPIGatewayProxyEvent<Gpt3Prompt>) {
    let userId;
    if (event.headers.authorization) userId = extractUserIdFromToken(event);
    const homePrompts: any = {
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

    const currentTime = Date.now();
    const last24Hours = currentTime - 24 * 60 * 60 * 1000;
    const last7Days = currentTime - 7 * 24 * 60 * 60 * 1000;
    let filter24H = `${SortKey.CREATED_AT} >= ${last24Hours} AND ${SortKey.CREATED_AT} <= ${currentTime}`;
    let filter7D = `${SortKey.CREATED_AT} >= ${last7Days} AND ${SortKey.CREATED_AT} <= ${currentTime}`;
    let filterUser = `createdBy.id = ${userId}`;

    // Make parallel requests for todayPrompts, mostDownloadedPrompts, popularWeeklyPrompts and trendingPrompts
    const [
      getAllPrompts,
      mostDownloadedPrompts,
      popularWeeklyPrompts,
      todayPrompts,
    ]: any = await Promise.all([
      getAllDocuments(),
      sortFromMeiliSearch(SortKey.DOWNLOADS, SortOrder.DESC),
      sortFromMeiliSearch(SortKey.VIEWS, SortOrder.DESC, filter7D, 20),
      sortFromMeiliSearch(SortKey.CREATED_AT, SortOrder.DESC, filter24H, 20),
    ]);

    homePrompts.todayPrompts.content = todayPrompts;
    homePrompts.mostDownloadedPrompts.content = mostDownloadedPrompts;
    homePrompts.popularWeeklyPrompts.content = popularWeeklyPrompts;

    if (userId) {
      const userRecentPrompts = await sortFromMeiliSearch(
        SortKey.CREATED_AT,
        SortOrder.DESC,
        filterUser,
        20
      );
      homePrompts.userRecentPrompts.content = userRecentPrompts;
    }

    const weightedScore = getAllPrompts.map((prompt: any) => {
      const score =
        prompt.likes * 1 + prompt.views * 0.5 + prompt.downloads * 0.25;
      return {
        ...prompt,
        score,
      };
    });

    // Sort the prompts based on the weighted score
    homePrompts.trendingPrompts.content = weightedScore.sort(
      (a: any, b: any) => b.score - a.score
    );

    return {
      statusCode: 200,
      body: JSON.stringify(homePrompts),
    };
  }

  // Search for a prompt
  @Route({
    method: HTTPMethod.POST,
    path: '/search',
  })
  async searchPromptHandler(event: ValidatedAPIGatewayProxyEvent<Gpt3Prompt>) {
    const { query, filters, sort, limit } = event.body as any;

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
  }

  @Route({
    method: HTTPMethod.POST,
    path: '/saveResult',
  })
  async createPromptResponseHandler(event: ValidatedAPIGatewayProxyEvent<any>) {
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
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/providers',
  })
  async getPromptResponseHandler(event: ValidatedAPIGatewayProxyEvent<any>) {
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
  }

  @Route({
    method: HTTPMethod.DELETE,
    path: '/saveResult/{id}/{resultId}',
  })
  async deletePromptResponseHandler(event: ValidatedAPIGatewayProxyEvent<any>) {
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
  }

  // User Auth Info for the prompt
  // OpenAI API Key with usage limits
  // It will be used both for create user auth and update user auth
  @Route({
    method: HTTPMethod.POST,
    path: '/saveResult',
  })
  async createUserAuthHandler(event: ValidatedAPIGatewayProxyEvent<any>) {
    const userId = extractUserIdFromToken(event);
    const workspaceId = process.env.DEFAULT_WORKSPACE_ID;
    let payload = {
      userId,
      workspaceId,
      auth: {},
    };

    const userInfoRes: UserApiInfo = (
      await Gpt3PromptUserEntity.get({
        userId,
        workspaceId,
      })
    ).Item as UserApiInfo;

    if (userInfoRes) {
      if (event.body) {
        payload = {
          ...payload,
          auth: {
            authData: {
              accessToken: event.body.accessToken,
            },
            authMetadata: userInfoRes.auth.authMetadata,
          },
        };
      } else {
        payload = {
          ...payload,
          auth: userInfoRes.auth,
        };
      }
    } else {
      payload = {
        ...payload,
        auth: {
          authData: {
            accessToken: null,
          },
          authMetadata: {
            provider: 'openai',
            limit: 10,
            usage: 0,
          },
        },
      };
    }

    const userRes = (
      await Gpt3PromptUserEntity.update(
        { ...payload },
        {
          returnValues: 'ALL_NEW',
        }
      )
    ).Attributes;

    if (userRes) {
      delete userRes.workspaceId;
      return {
        statusCode: 200,
        body: JSON.stringify(userRes),
      };
    } else throw createError(400, 'User not found');
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/userAuth',
  })
  async getUserAuthHandler(event: ValidatedAPIGatewayProxyEvent<any>) {
    const userId = extractUserIdFromToken(event);
    const workspaceId = process.env.DEFAULT_WORKSPACE_ID;

    const userInfoRes: UserApiInfo = (
      await Gpt3PromptUserEntity.get({
        userId,
        workspaceId,
      })
    ).Item as UserApiInfo;

    if (userInfoRes) {
      delete userInfoRes.workspaceId;
      return {
        statusCode: 200,
        body: JSON.stringify(userInfoRes),
      };
    } else {
      const payload = {
        userId,
        workspaceId,
        auth: {
          authData: {
            accessToken: null,
          },
          authMetadata: {
            provider: 'openai',
            limit: 10,
            usage: 0,
          },
        },
      };

      const userRes = (
        await Gpt3PromptUserEntity.update(
          { ...payload },
          {
            returnValues: 'ALL_NEW',
          }
        )
      ).Attributes;

      if (userRes) {
        delete userRes.workspaceId;
        return {
          statusCode: 200,
          body: JSON.stringify(userRes),
        };
      } else throw createError(400, 'Error creating user');
    }
  }

  @RouteAndExec()
  execute(event) {
    return event;
  }
}
