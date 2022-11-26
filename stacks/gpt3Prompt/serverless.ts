import merge from 'deepmerge';
import type { Serverless } from 'serverless/aws';
import { baseServerlessConfiguration } from '../../serverless.base';
import functions from './src';
import { combineMerge } from './utils/helpers';

const gpt3PromptServerlessConfig = {
  service: 'gpt3Prompt',
  custom: {
    ...baseServerlessConfiguration.custom,
    'serverless-offline': {
      httpPort: 4000, //set different port for each service
      lambdaPort: 4002,
      ignoreJWTSignature: true,
      noAuth: true,
    },
    customDomain: {
      http: {
        basePath: 'gpt3Prompt',
      },
    },
    autoswagger: {
      typefiles: ['./src/interface.ts'],
    },
    assets: {
      target: {
        prefix: 'gpt3Prompt-service',
      },
    },
  },
  functions,
};

const serverlessConfiguration = <Serverless>(
  merge(baseServerlessConfiguration, gpt3PromptServerlessConfig, {
    arrayMerge: combineMerge,
  })
);

module.exports = serverlessConfiguration;
