import merge from 'deepmerge';
import type { Serverless } from 'serverless/aws';
import { baseServerlessConfiguration } from '../../serverless.base';
import Table from './infra/dynamodb/single-table';
import { hello } from './src';
import { combineMerge } from './utils/helpers';

const commentServerlessConfig = {
  service: 'comment',
  custom: {
    ...baseServerlessConfiguration.custom,
    'serverless-offline': {
      httpPort: 4010, //set different port for each service
      lambdaPort: 4012,
      ignoreJWTSignature: true,
      noAuth: true,
    },
    customDomain: {
      http: {
        basePath: 'comment',
      },
    },
    autoswagger: {
      typefiles: ['./src/interface.ts'],
    },
    assets: {
      target: {
        prefix: 'comment-service',
      },
    },
  },
  functions: {
    hello,
  },
  resources: {
    Resources: Table,
  },
};

const serverlessConfiguration = <Serverless>(
  merge(baseServerlessConfiguration, commentServerlessConfig, {
    arrayMerge: combineMerge,
  })
);

module.exports = serverlessConfiguration;
