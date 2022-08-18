import type { Serverless } from 'serverless/aws';

export const baseServerlessConfiguration: Partial<Serverless> = {
  frameworkVersion: '3',
  package: {
    individually: true,
    excludeDevDependencies: true,
  },
  plugins: [
    '@workduck-io/serverless-auto-swagger',
    'serverless-esbuild',
    'serverless-dynamodb-local',
    'serverless-offline',
    'serverless-domain-manager',
    'serverless-prune-plugin',
    'serverless-s3-deploy',
  ],
  custom: {
    enabled: {
      dev: true,
      test: true,
      other: false,
    },
    stage: '${opt:stage, self:provider.stage}',
    esbuild: {
      packager: 'yarn',
      minify: true,
      bundle: true,
      sourcemap: true,
    },
    prune: {
      automatic: true,
      number: 5,
    },
    customDomain: {
      http: {
        domainName: 'http-${opt:stage, self:provider.stage}.workduck.io',
        createRoute53Record: true,
        endpointType: 'regional',
        enabled:
          '${self:custom.enabled.${opt:stage, self:provider.stage}, self:custom.enabled.other}',
        apiType: 'http',
      },
    },
    dynamodb: {
      stages: ['local'],
      start: {
        port: 8000,
        migrate: true,
        noStart: true,
      },
    },
    autoswagger: {
      typefiles: ['./src/interface.ts'],
      useStage: true,
      deploySwagger: false,
      includeStages: ['local'],
      swaggerPath: 'swagger',
      apiKeyHeaders: ['Authorization', 'mex-workspace-id', 'wd-request-id'],
    },
    assets: {
      auto: true,
      targets: [
        {
          bucket: 'swagger-files-${opt:stage, self:provider.stage}',
          files: [
            {
              source: './swagger',
              globs: 'swagger.js',
            },
          ],
        },
      ],
    },
  },
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
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
    iam: {
      role: {
        statements: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:Scan',
              'dynamodb:Query',
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
              'dynamodb:DescribeTable',
              'dynamodb:BatchWriteItem',
              'dynamodb:BatchGetItem',
              'dynamodb:UpdateTimeToLive',
            ],
            Resource: 'arn:aws:dynamodb:us-east-1:*:*',
          },
        ],
      },
    },

    region: 'us-east-1',
    httpApi: {
      cors: {
        allowedOrigins: ['*'],
        allowedHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Amz-User-Agent',
          'X-Amzn-Trace-Id',
          'mex-workspace-id',
          'wd-request-id',
        ],
      },
      //@ts-ignore
      disableDefaultEndpoint: true,
      authorizers: {
        workduckAuthorizer: {
          identitySource: '$request.header.Authorization',
          issuerUrl:
            'https://cognito-idp.' +
            '${opt:region, self:provider.region}' +
            '.amazonaws.com/' +
            'us-east-1_Zu7FAh7hj',

          audience: ['6pvqt64p0l2kqkk2qafgdh13qe'],
        },
      },
    },
  },
};
