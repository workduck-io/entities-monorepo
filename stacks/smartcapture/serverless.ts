import merge from 'deepmerge';
import type { Serverless } from 'serverless/aws';
import { baseServerlessConfiguration } from '../../serverless.base';
import functions from './src';
import { combineMerge } from './utils/helpers';

const smartCaptureServerlessConfig = {
  service: 'smartcapture',
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
        basePath: 'smartcapture',
      },
    },
    autoswagger: {
      typefiles: ['./src/interface.ts'],
    },
    assets: {
      target: {
        prefix: 'smartcapture-service',
      },
    },
  },
  functions,
};

const serverlessConfiguration = <Serverless>(
  merge(baseServerlessConfiguration, smartCaptureServerlessConfig, {
    arrayMerge: combineMerge,
  })
);

module.exports = serverlessConfiguration;
