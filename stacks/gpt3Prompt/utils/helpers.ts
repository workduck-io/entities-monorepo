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

export const removeAtrributes = (data: any, attributes: string[]) => {
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
