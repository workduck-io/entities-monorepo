import { extractUserIdFromToken, extractWorkspaceId } from '@mex/gen-utils';
import { createError } from '@middy/util';
import { ValidatedAPIGatewayProxyHandler } from '@workduck-io/lambda-routing';
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
  updateDocumentInMeiliSearch,
} from '../../utils/meiliSearchHelper';
import {
  Gpt3PromptAnalyticsEntity,
  Gpt3PromptEntity,
  Gpt3PromptUserEntity,
} from '../entities';
import {
  Gpt3Prompt,
  Gpt3PromptBody,
  MeiliSearchDocumentResponse,
  PromptDownloadState,
  UserApiInfo,
} from '../interface';

import { defaultGPT3Props, PromptProviders } from '../../utils/consts';

export const createPromptHandler: ValidatedAPIGatewayProxyHandler<
  Gpt3Prompt
> = async (event) => {
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
  } catch (e) {
    throw createError(400, e.message);
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
    throw createError(400, e.message);
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
  } catch (e) {
    throw createError(400, e.message);
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
    else throw createError(400, 'Error deleting prompt');
  } catch (e) {
    throw createError(400, e.message);
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
    else throw createError(400, 'Error downloading prompt');
  } catch (e) {
    throw createError(400, e.message);
  }
};
// Results of a prompt
export const resultPrompthandler: ValidatedAPIGatewayProxyHandler<
  Gpt3Prompt
> = async (event) => {
  const workspaceId = process.env.DEFAULT_WORKSPACE_ID;
  const userId = extractUserIdFromToken(event);
  const { id } = event.pathParameters;
  let options: Gpt3Prompt['properties'],
    variablesValues: Record<string, string>,
    promptRes,
    transformedPrompt;
  let properties = null;

  try {
    if (id === 'preview') {
      const body = event.body as any;
      const { prompt, variables } = event.body;
      options = body.options;
      transformedPrompt = replaceVarWithValForPreview(prompt, variables);
    } else {
      options = event.body as unknown as Gpt3Prompt['properties'];
      variablesValues = event.body as unknown as Record<string, string>;

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
  } catch (e) {
    throw createError(400, e.message);
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
    throw createError(400, e.message);
  }
};

// Get all prompts dwonloaded by the user
export const getAllUserPromptsHandler: ValidatedAPIGatewayProxyHandler<
  Gpt3Prompt
> = async (event) => {
  const workspaceId = process.env.DEFAULT_WORKSPACE_ID;
  const currentUserId = extractUserIdFromToken(event);

  let downloadedRes, createdRes, defaultRes;
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
  } catch (e) {
    throw createError(400, e.message);
  }
};

// Get all prompts provider
export const getAllPromptsProviderHandler: ValidatedAPIGatewayProxyHandler<
  any
> = async (event) => {
  const providers = PromptProviders;
  return {
    statusCode: 200,
    body: JSON.stringify(providers),
  };
};
