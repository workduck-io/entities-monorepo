import Table from './infra/dynamodb/single-table';
import functions from './src';

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
  resources: {
    Resources: Table,
  },
  provider: {
    name: 'aws',
    runtime: 'nodejs16.x',
    memorySize: 512,
    logRetentionInDays: 7,
    apiGateway: {
      minimumCompressionSize: 1024,
    },
    stage: 'local',
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      SLS_STAGE: '${self:custom.stage}',
    },
    region: 'us-east-1',
  },
  functions,
};

module.exports = gpt3PromptServerlessConfig;
