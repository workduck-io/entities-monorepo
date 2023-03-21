export default {
  HierarchyTable: {
    Type: 'AWS::DynamoDB::Table',
    DeletionPolicy: 'Retain',
    Properties: {
      TableName: '${self:custom.stage}-hierarchy-store',
      AttributeDefinitions: [
        {
          AttributeName: 'pk',
          AttributeType: 'S',
        },
        {
          AttributeName: 'path',
          AttributeType: 'S',
        },
        {
          AttributeName: 'tree',
          AttributeType: 'S',
        },
      ],
      KeySchema: [
        {
          AttributeName: 'pk',
          KeyType: 'HASH',
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: '10',
        WriteCapacityUnits: '10',
      },
      GlobalSecondaryIndexes: [
        {
          IndexName: 'tree-path-index',
          KeySchema: [
            {
              AttributeName: 'tree',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'path',
              KeyType: 'RANGE',
            },
          ],
          Projection: {
            ProjectionType: 'ALL',
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: '5',
            WriteCapacityUnits: '5',
          },
        },
      ],
    },
  },
};
