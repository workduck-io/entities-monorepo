import merge from 'deepmerge';
import type { Serverless } from 'serverless/aws';
import { baseServerlessConfiguration } from '../../serverless.base';

import functions from './src';
import { combineMerge } from './utils/helpers';

const reactionServerlessConfig = {
  service: 'reaction',
  custom: {
    ...baseServerlessConfiguration.custom,
    'serverless-offline': {
      httpPort: 4020, //set different port for each service
      lambdaPort: 4022,
      ignoreJWTSignature: true,
      noAuth: true,
    },
    customDomain: {
      http: {
        basePath: 'reaction',
      },
    },
    autoswagger: {
      typefiles: ['./src/interface.ts'],
    },
    assets: {
      target: {
        prefix: 'reaction-service',
      },
    },
  },
  functions,
};

const serverlessConfiguration = <Serverless>(
  merge(baseServerlessConfiguration, reactionServerlessConfig, {
    arrayMerge: combineMerge,
  })
);

module.exports = serverlessConfiguration;
