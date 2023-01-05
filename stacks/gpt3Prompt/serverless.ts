import Table from './infra/dynamodb/single-table';
import functions from './src';
import { baseServerlessConfiguration } from '../../serverless.base';
import type { Serverless } from 'serverless/aws';
import { combineMerge } from './utils/helpers';
import merge from 'deepmerge';

const gpt3PromptServerlessConfig = {
  service: 'gpt3Prompt',
  package: {
    individually: true,
    excludeDevDependencies: true,
  },
  plugins: [
    'serverless-esbuild',
    'serverless-dynamodb-local',
    'serverless-offline',
    'serverless-prune-plugin',
  ],
  custom: {
    stage: '${opt:stage, self:provider.stage}',
    'serverless-offline': {
      httpPort: 4000, //set different port for each service
      lambdaPort: 4002,
      ignoreJWTSignature: true,
      noAuth: true,
    },
    prune: {
      automatic: true,
      number: 5,
    },

    dynamodb: {
      stages: ['local'],
      start: {
        port: 8000,
        migrate: true,
        noStart: true,
      },
    },
    customDomain: {
      http: {
        basePath: 'prompt',
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
  resources: {
    Resources: Table,
  },
  functions,
};

const serverlessConfiguration = <Serverless>(
  merge(baseServerlessConfiguration, gpt3PromptServerlessConfig, {
    arrayMerge: combineMerge,
  })
);

module.exports = serverlessConfiguration;
