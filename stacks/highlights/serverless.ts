import merge from 'deepmerge';
import type { Serverless } from 'serverless/aws';
import { baseServerlessConfiguration } from '../../serverless.base';
import functions from './src';
import { combineMerge } from './utils/helpers';

const highlightsServerlessConfig = {
  service: 'highlights',
  custom: {
    ...baseServerlessConfiguration.custom,
    'serverless-offline': {
      httpPort: 4100, //set different port for each service
      lambdaPort: 4102,
      ignoreJWTSignature: true,
      noAuth: true,
    },
    customDomain: {
      http: {
        basePath: 'highlights',
      },
    },
    autoswagger: {
      typefiles: ['./src/interface.ts'],
    },
    assets: {
      target: {
        prefix: 'highlights-service',
      },
    },
  },
  functions,
};

const serverlessConfiguration = <Serverless>(
  merge(baseServerlessConfiguration, highlightsServerlessConfig, {
    arrayMerge: combineMerge,
  })
);

module.exports = serverlessConfiguration;
