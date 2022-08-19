import merge from 'deepmerge';
import type { Serverless } from 'serverless/aws';
import { baseServerlessConfiguration } from '../../serverless.base';
import Table from './infra/dynamodb/single-table';
import functions from './src';
import { combineMerge } from './utils/helpers';

const taskServerlessConfig = {
  service: 'task',
  custom: {
    ...baseServerlessConfiguration.custom,
    'serverless-offline': {
      httpPort: 4000, //set different port for each service
      lambdaPort: 4002,
      // ignoreJWTSignature: true,
      // noAuth: true,
    },
    customDomain: {
      http: {
        basePath: 'task',
      },
    },
    autoswagger: {
      typefiles: ['./src/interface.ts'],
    },
    assets: {
      targets: [
        {
          prefix: 'public/task-service',
        },
      ],
    },
  },
  functions,
  resources: {
    Resources: Table,
  },
};

const serverlessConfiguration = <Serverless>(
  merge(baseServerlessConfiguration, taskServerlessConfig, {
    arrayMerge: combineMerge,
  })
);

module.exports = serverlessConfiguration;
