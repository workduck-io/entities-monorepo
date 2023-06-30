import { createError } from '@middy/util';
import merge from 'deepmerge';
import { Configuration, CreateChatCompletionResponse, OpenAIApi } from 'openai';
import { lambda } from '../libs/lambda-lib';
import { Gpt3PromptEntity, Gpt3PromptUserEntity } from '../src/entities';
import {
  ChatGPTCreationContext,
  ChatGPTCreationRequest,
  Gpt3Prompt,
  UserApiInfo,
} from '../src/interface';
import { DEFAULT_USAGE_LIMIT, defaultGPT3Props } from './consts';
import {
  PromptInputFormat,
  PromptOutputFormat,
  Prompts,
  SystemPrompt,
} from './prompts';

export const combineMerge = (target, source, options) => {
  const destination = target.slice();

  source.forEach((item, index) => {
    if (typeof destination[index] === 'undefined') {
      destination[index] = options.cloneUnlessOtherwiseSpecified(item, options);
    } else if (options.isMergeableObject(item)) {
      destination[index] = merge(target[index], item, options);
    } else if (target.indexOf(item) === -1) {
      destination.push(item);
    }
  });
  return destination;
};

export const openaiInstance = (apiKey: string) => {
  return new OpenAIApi(new Configuration({ apiKey }));
};

export const getUserInfo = async (event: any) => {
  try {
    return await lambda.invokeAndCheck(
      'workduck-user-service-dev-getUser',
      'RequestResponse',
      {
        routeKey: 'GET /',
        httpMethod: 'GET',
        headers: {
          authorization: event.headers.authorization,
        },
      }
    );
  } catch (error) {
    throw createError(400, 'Error getting user info');
  }
};

export const replaceVarWithVal = (
  originalStr: string,
  variables?: Array<{ id: string; default?: string }>,
  variablesValues?: Record<string, string>
) => {
  const regex = /(?<={).+?(?=\})/g; // find all variables ( matching format {*} )
  const vars = originalStr.match(regex);
  if (vars && !variables)
    throw new Error(
      `Variables are present in promptInput but variables are not present in input`
    );
  else if (vars) {
    vars.forEach((v) => {
      const value =
        variablesValues?.[v] ||
        variables.find((variable) => variable.id === v)?.default;
      if (!value)
        throw new Error(
          `Variable ${v} is not present in variablesValues or default value is not present in variables`
        );
      originalStr = originalStr.replace(`{${v}}`, value);
    });
  }
  return originalStr;
};

export const replaceVarWithValForPreview = (
  originalStr: string,
  variablesValues: Array<{ id: string; default?: string }>
) => {
  const regex = /(?<={).+?(?=\})/g; // find all variables ( matching format {*} )
  const vars = originalStr.match(regex);
  if (vars) {
    vars.forEach((v) => {
      variablesValues.forEach((item) => {
        if (item.id === v)
          originalStr = originalStr.replace(`{${v}}`, item.default);
      });
    });
  }
  return originalStr;
};

export const pickAttributes = (obj: any, attributes: string[]) => {
  return attributes.reduce((acc: any, curr: any) => {
    return { ...acc, [curr]: obj[curr] };
  }, {});
};

export const removeAtrributes = <T>(data: T[] | T, attributes: (keyof T)[]) => {
  if (Array.isArray(data)) {
    return data.map((obj: any) => {
      attributes.forEach((attribute) => {
        delete obj[attribute];
      });
      return obj;
    });
  } else if (typeof data === 'object') {
    attributes.forEach((attribute) => {
      delete data[attribute];
    });
    return data;
  } else {
    return data;
  }
};

export const combineString = (...stringArgs: string[]) => {
  return stringArgs.reduce((acc, val) => {
    return `${acc}${val}\n`;
  }, '');
};

export const convertToChatCompletionRequest =
  (
    input: keyof typeof PromptInputFormat = 'MARKDOWN',
    output: keyof typeof PromptOutputFormat = 'MARKDOWN'
  ) =>
  (item: ChatGPTCreationRequest) => {
    let prompt: string;
    if (item.role === 'user') {
      prompt = combineString(PromptOutputFormat[output]);
      if (item.type && Prompts[item.type]) {
        prompt = combineString(
          PromptInputFormat[input],
          Prompts[item.type],
          prompt
        );
        if (item.content) prompt += `${item.content}\n\n${item.type}: `;
      } else prompt = combineString(item.content, PromptOutputFormat[output]);
    }

    return {
      role: item.role,
      content: prompt ?? item.content,
    };
  };

export const getOrSetUserOpenAiInfo = async (
  workspaceId: string,
  userId: string,
  openAiAccessToken?: string
) => {
  const userAuthInfo: UserApiInfo = (
    await Gpt3PromptUserEntity.get({
      userId,
      workspaceId,
    })
  ).Item as UserApiInfo;
  if (!userAuthInfo) {
    const payload = {
      userId,
      workspaceId,
      auth: {
        authData: {
          accessToken: openAiAccessToken,
        },
        authMetadata: {
          provider: 'openai',
          limit: DEFAULT_USAGE_LIMIT,
          usage: 0,
        },
      },
    };
    return (
      await Gpt3PromptUserEntity.update(payload, {
        returnValues: 'ALL_NEW',
      })
    ).Attributes as UserApiInfo;
  }
  if (!userAuthInfo.auth?.authData?.accessToken && openAiAccessToken) {
    const payload = {
      userId,
      workspaceId,
      auth: {
        authData: {
          accessToken: openAiAccessToken,
        },
        authMetadata: userAuthInfo.auth.authMetadata,
      },
    };
    return (
      await Gpt3PromptUserEntity.update(payload, {
        returnValues: 'ALL_NEW',
      })
    ).Attributes as UserApiInfo;
  }
  return userAuthInfo;
};

export const validateUserAuth = async (
  workspaceId: string,
  userId: string,
  returnConfig = false
) => {
  const userAuthInfo = await getOrSetUserOpenAiInfo(workspaceId, userId);
  let apiKey;
  let userFlag = false;
  const userToken = userAuthInfo.auth?.authData?.accessToken;

  if (userToken) {
    apiKey = userAuthInfo.auth?.authData?.accessToken;
    userFlag = true;
  } else {
    // If the user has not set the access token, then use the default one with check for the limit
    if (userAuthInfo.auth?.authMetadata.limit > 0) {
    } else if (userAuthInfo.auth?.authMetadata.limit <= 0) {
      throw createError(402, "You've reached your limit for the month");
    } else {
      throw createError(402, 'You need to set up your OpenAI API key');
    }
  }
  return {
    apiKey,
    userFlag,
    userAuthInfo: returnConfig ? userAuthInfo : undefined,
  };
};

export const validateUsageAndExecutePrompt = async (
  workspaceId: string,
  userId: string,
  callback: (openai: OpenAIApi) => Promise<CreateChatCompletionResponse>
) => {
  try {
    const { apiKey, userFlag, userAuthInfo } = await validateUserAuth(
      workspaceId,
      userId,
      true
    );
    const completions = await callback(openaiInstance(apiKey));
    if (completions && completions && completions.choices.length > 0) {
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
        body: JSON.stringify(completions.choices[0].message),
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify([]),
    };
  } catch (err) {
    console.error(err.response.data);
    throw createError(
      err?.statusCode ?? 400,
      err?.message ?? 'Error fetching results'
    );
  }
};

export const preparePromptRequestFromId = async (
  promptId: string,
  variablesValues?: Record<string, string>,
  options?: Gpt3Prompt['properties']
) => {
  let promptRes, transformedPrompt;
  let properties = null;
  promptRes = (
    await Gpt3PromptEntity.get({
      entityId: promptId,
      workspaceId: process.env.DEFAULT_WORKSPACE_ID,
    })
  ).Item;

  const { prompt, variables } = promptRes;
  properties = promptRes.properties;

  // Replace the variables with the values
  transformedPrompt = replaceVarWithVal(prompt, variables, variablesValues);
  return {
    messages: [
      SystemPrompt,
      ...[{ role: 'user', content: transformedPrompt }].map(
        convertToChatCompletionRequest()
      ),
    ],
    model: defaultGPT3Props.model,
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
};

export const preparePromptRequestFromContext = (
  context: ChatGPTCreationContext,
  input?: keyof typeof PromptInputFormat,
  output?: keyof typeof PromptOutputFormat
) => {
  return {
    model: 'gpt-3.5-turbo',
    messages: [
      SystemPrompt,
      ...context.map(convertToChatCompletionRequest(input, output)),
    ],
  };
};
