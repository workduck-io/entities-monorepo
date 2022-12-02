export default {
  GPT3TableDesignDynamoDBTable: {
    Type: 'AWS::DynamoDB::Table',
    Properties: {
      TableName: '${self:custom.stage}-gpt3-store',
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
        ReadCapacityUnits: '10',
        WriteCapacityUnits: '10',
      },
      GlobalSecondaryIndexes: [
        {
          IndexName: 'pk-ak-index',
          KeySchema: [
            {
              AttributeName: 'pk',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'ak',
              KeyType: 'RANGE',
            },
          ],
          Projection: {
            ProjectionType: 'ALL',
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: '10',
            WriteCapacityUnits: '10',
          },
        },
      ],
    },
  },
};
