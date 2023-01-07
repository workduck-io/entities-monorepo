import { extractUserIdFromToken } from '@mex/gen-utils';
import { createError } from '@middy/util';
import { ValidatedAPIGatewayProxyHandler } from '@workduck-io/lambda-routing';
import { Gpt3PromptUserEntity } from '../entities';
import { UserApiInfo } from '../interface';

// User Auth Info for the prompt
// OpenAI API Key with usage limits
// It will be used both for create user auth and update user auth
export const createUserAuthHandler: ValidatedAPIGatewayProxyHandler<
  any
> = async (event) => {
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
    if (event.body && event.body.authToken) {
      payload = {
        ...payload,
        auth: {
          authData: {
            accessToken: event.body.authToken,
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
    return {
      statusCode: 200,
      body: JSON.stringify(userRes),
    };
  } else throw createError(400, JSON.stringify('User not found'));
};

export const getUserAuthHandler: ValidatedAPIGatewayProxyHandler<any> = async (
  event
) => {
  const userId = extractUserIdFromToken(event);
  const workspaceId = process.env.DEFAULT_WORKSPACE_ID;

  const userInfoRes: UserApiInfo = (
    await Gpt3PromptUserEntity.get({
      userId,
      workspaceId,
    })
  ).Item as UserApiInfo;

  if (userInfoRes) {
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
      return {
        statusCode: 200,
        body: JSON.stringify(userRes),
      };
    } else throw createError(400, JSON.stringify('Error creating user'));
  }
};
