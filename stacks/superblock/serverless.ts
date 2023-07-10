import merge from 'deepmerge';
import type { Serverless } from 'serverless/aws';
import { baseServerlessConfiguration } from '../../serverless.base';
import functions from './src';
import { combineMerge } from './utils/helpers';

const superblockServerlessConfig = {
  service: 'superblock',
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
        basePath: 'superblock',
      },
    },
    autoswagger: {
      typefiles: ['./src/interface.ts'],
    },
    assets: {
      target: {
        prefix: 'superblock-service',
      },
    },
  },
  functions,
};

const serverlessConfiguration = <Serverless>(
  merge(baseServerlessConfiguration, superblockServerlessConfig, {
    arrayMerge: combineMerge,
  })
);

module.exports = serverlessConfiguration;
