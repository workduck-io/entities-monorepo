import type { Serverless } from 'serverless/aws';

export const baseServerlessConfiguration: Partial<Serverless> = {
  frameworkVersion: '3',
  useDotenv: true,
  package: {
    individually: true,
    excludeDevDependencies: true,
  },
  plugins: [
    '@workduck-io/serverless-auto-swagger',
    'serverless-esbuild',
    'serverless-dotenv-plugin',
    'serverless-dynamodb-local',
    'serverless-offline',
    // 'serverless-domain-manager',
    'serverless-prune-plugin',
    // 'serverless-s3-deploy',
  ],
  custom: {
    enabled: {
      dev: true,
      test: true,
      staging: false,
      other: false,
    },
    stage: '${opt:stage, self:provider.stage}',
    esbuild: {
      packager: 'yarn',
      minify: false,
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
    cognitoPoolMaps: {
      dev: 'us-east-1_Zu7FAh7hj',
      staging: 'us-east-1_Zu7FAh7hj',
      test: 'us-east-1_O5YTlVrCd',
      local: 'us-east-1_Zu7FAh7hj',
    },
    cognitoClientIDMaps: {
      dev: '6pvqt64p0l2kqkk2qafgdh13qe',
      staging: '6pvqt64p0l2kqkk2qafgdh13qe',
      test: '25qd6eq6vv3906osgv8v3f8c6v',
      local: '6pvqt64p0l2kqkk2qafgdh13qe',
    },
  },
  provider: {
    name: 'aws',
    runtime: 'nodejs18.x',
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
          {
            Effect: 'Allow',
            Action: ['lambda:InvokeFunction', 'lambda:InvokeAsync'],
            Resource: '*',
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
          'mex-api-ver',
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
            '${self:custom.cognitoPoolMaps.${opt:stage, self:provider.stage}}',

          audience: [
            '${self:custom.cognitoClientIDMaps.${opt:stage, self:provider.stage}}',
          ],
        },
      },
    },
  },
};
