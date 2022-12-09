import { createError } from '@middy/util';
import merge from 'deepmerge';

import { Configuration, OpenAIApi } from 'openai';
import { lambda } from '../libs/lambda-lib';

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

export const getEndpoint = () => {
  if (process.env.AWS_EXECUTION_ENV) {
    return undefined;
  } else if (process.env.DYNAMODB_ENDPOINT) {
    return `http://${process.env.DYNAMODB_ENDPOINT}`;
  } else {
    return 'http://localhost:8000';
  }
};

export const getRegion = () => {
  if (process.env.AWS_EXECUTION_ENV) {
    return undefined;
  } else if (process.env.AWS_REGION) {
    return process.env.AWS_REGION;
  } else if (process.env.AWS_DEFAULT_REGION) {
    return process.env.AWS_DEFAULT_REGION;
  } else {
    return 'local';
  }
};

export const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPENAI_API_KEY })
);

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
  variables: Array<{ id: string; name: string }>,
  variablesValues: Record<string, string>
) => {
  const regex = /(?<={).+?(?=\})/g; // find all variables ( matching format {*} )
  const vars = originalStr.match(regex);
  let result = originalStr;
  // replace all variables with their values
  if (vars) {
    vars.forEach((v) => {
      const variable = variables.find((variable) => variable.name === v);
      if (variable) {
        const value = variablesValues[variable.id];
        result = result.replace(`{${v}}`, value);
      }
    });
  }
  // check if string contains "undefined"
  if (result.includes('undefined'))
    throw createError(400, 'Error replacing variables with values');
  else return result;
};
