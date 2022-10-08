import merge from 'deepmerge';
import type { Serverless } from 'serverless/aws';
import { baseServerlessConfiguration } from '../../serverless.base';
import Table from './infra/dynamodb/single-table';
import functions from './src';
import { combineMerge } from './utils/helpers';

const reminderServerlessConfig = {
  service: 'reminder',
  custom: {
    ...baseServerlessConfiguration.custom,
    'serverless-offline': {
      httpPort: 4040, //set different port for each service
      lambdaPort: 4042,
      ignoreJWTSignature: true,
      noAuth: true,
    },
    customDomain: {
      http: {
        basePath: 'reminder',
      },
    },
    autoswagger: {
      typefiles: ['./src/interface.ts'],
    },
    assets: {
      target: {
        prefix: 'reminder-service',
      },
    },
  },
  functions,
  resources: {
    Resources: Table,
  },
};

const serverlessConfiguration = <Serverless>(
  merge(baseServerlessConfiguration, reminderServerlessConfig, {
    arrayMerge: combineMerge,
  })
);

module.exports = serverlessConfiguration;
