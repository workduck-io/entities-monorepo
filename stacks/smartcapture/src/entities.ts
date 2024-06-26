import { AdvancedElements, defaultEntityAttributes } from '@mex/entity-utils';
import { Entity } from 'dynamodb-toolbox';
import { smartcaptureTable } from '../service/DynamoDB';
import { ENTITYSOURCE } from '../utils/consts';
import { serializeConfig } from '../utils/helpers';

export const CaptureVariableLabelEntity = new Entity({
  name: 'captureVariableLabel',
  attributes: {
    variableId: {
      partitionKey: true,
      type: 'string',
    },
    id: { sortKey: true, type: 'string', coerce: false },
    configId: {
      type: 'string',
      map: 'ak',
      coerce: false,
    },
    base: {
      type: 'string',
      required: true,
    },
    _source: {
      type: 'string',
      default: () => ENTITYSOURCE.INTERNAL,
      hidden: true,
    },
    _status: { type: 'string', default: () => 'ACTIVE', hidden: true },
    _ttl: { type: 'number', hidden: true },
    userId: { type: 'string', required: true },
    properties: { type: 'map' },
  },
  table: smartcaptureTable,
} as const);

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
    base: {
      type: 'string',
      map: 'ak',
      coerce: false,
    },
    dataOrder: {
      type: 'list',
      hidden: true,
      onUpdate: false,
      default: (data: any) => {
        if (Array.isArray(data.labels))
          return serializeConfig(data.labels).order;
        return undefined;
      },
    },
    labels: {
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

export const CaptureEntity = new Entity({
  name: 'capture',
  attributes: {
    workspaceId: {
      partitionKey: true,
      type: 'string',
    },
    entityId: { sortKey: true, type: 'string' },
    configId: { type: 'string', required: true, map: 'ak' },
    userId: {
      type: 'string',
      required: true,
    },
    data: {
      type: 'string',
      transform: (value: AdvancedElements) => {
        return JSON.stringify(value);
      },
      format: (value: string): AdvancedElements => {
        return JSON.parse(value);
      },
    },
    _source: {
      type: 'string',
      default: () => ENTITYSOURCE.EXTERNAL,
      hidden: true,
    },
    _status: { type: 'string', default: () => 'ACTIVE', hidden: true },
    _ttl: { type: 'number', hidden: true },

    properties: { type: 'map' },
  },
  table: smartcaptureTable,
  timestamps: false,
} as const);
