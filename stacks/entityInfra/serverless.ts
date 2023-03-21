import type { Serverless } from 'serverless/aws';
import EntityTable from './infra/dynamodb/entity-table';
import HierarchyTable from './infra/dynamodb/hierarchy-table';

export const serverlessConfiguration: Partial<Serverless> = {
  frameworkVersion: '3',
  service: 'entity-infra',
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
  resources: {
    Resources: { ...EntityTable, ...HierarchyTable },
  },
};
module.exports = serverlessConfiguration;
