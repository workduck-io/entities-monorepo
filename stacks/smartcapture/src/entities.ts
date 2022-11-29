import { defaultEntityAttributes } from '@mex/entity-utils';
import { Entity } from 'dynamodb-toolbox';
import { smartcaptureTable } from '../service/DynamoDB';
import { serializeConfig } from '../utils/helpers';

export const CaptureVariableEntity = new Entity({
  name: 'captureVariable',
  attributes: {
    ...defaultEntityAttributes,
    entityId: {
      sortKey: true,
      type: 'string',
      coerce: false,
      prefix: 'VARIABLE#',
    },
    variableName: { type: 'string' },
  },
  table: smartcaptureTable,
} as const);

export const CaptureConfigEntity = new Entity({
  name: 'captureConfig',
  attributes: {
    ...defaultEntityAttributes,
    regex: {
      type: 'string',
      coerce: false,
    },
    dataOrder: {
      type: 'list',
      hidden: true,
      onUpdate: false,
      default: (data: any) => {
        if (Array.isArray(data.config))
          return serializeConfig(data.config).order;
        return undefined;
      },
    },
    config: {
      type: 'map',
      transform: (value) => {
        if (Array.isArray(value)) {
          return serializeConfig(value).data;
        } else return value;
      },
      format: (value, data: any) => {
        return data.dataOrder.map((key) => {
          return value[key];
        });
      },
    },
  },
  table: smartcaptureTable,
} as const);
