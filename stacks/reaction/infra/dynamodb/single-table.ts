export default {
  SingleTableDesignDynamoDBTable: {
    Type: 'AWS::DynamoDB::Table',
    Properties: {
      TableName: '${self:custom.stage}-reaction-store',
      AttributeDefinitions: [
        {
          AttributeName: 'pk',
          AttributeType: 'S',
        },
        {
          AttributeName: 'sk',
          AttributeType: 'S',
        },
        {
          AttributeName: 'ak',
          AttributeType: 'S',
        },
      ],
      KeySchema: [
        {
          AttributeName: 'pk',
          KeyType: 'HASH',
        },
        {
          AttributeName: 'sk',
          KeyType: 'RANGE',
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: '15',
        WriteCapacityUnits: '15',
      },
      GlobalSecondaryIndexes: [
        {
          IndexName: 'reverse-index',
          KeySchema: [
            {
              AttributeName: 'sk',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'pk',
              KeyType: 'RANGE',
            },
          ],
          Projection: {
            ProjectionType: 'ALL',
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: '15',
            WriteCapacityUnits: '15',
          },
        },
        {
          IndexName: 'ak-sk-index',
          KeySchema: [
            {
              AttributeName: 'ak',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'sk',
              KeyType: 'RANGE',
            },
          ],
          Projection: {
            ProjectionType: 'ALL',
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: '15',
            WriteCapacityUnits: '15',
          },
        },
      ],
    },
  },
};
