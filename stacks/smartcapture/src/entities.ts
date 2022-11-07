import { initializeEntity } from '@mex/entity-utils';
import { smartcaptureTable } from '../service/DynamoDB';

export const CaptureVariableEntity = initializeEntity({
  name: 'captureVariable',
  additionalAttributes: {
    entityId: {
      sortKey: true,
      type: 'string',
      coerce: false,
      prefix: 'VARIABLE#',
    },
    variableName: { type: 'string' },
    userId: { type: 'string', required: false },
  },
  table: smartcaptureTable,
} as const);

export const CaptureLabelEntity = initializeEntity({
  name: 'captureLabel',
  additionalAttributes: {
    entityId: {
      sortKey: true,
      type: 'string',
      coerce: false,
      prefix: 'LABEL#',
    },
    variableId: { type: 'string', required: 'always', prefix: 'VARIABLE#' },
    labelName: { type: 'string' },
    path: { type: 'string', required: 'always' },
    webPage: { type: 'string', required: 'always', map: 'ak' },
    regex: { type: 'string', required: 'always' },
  },
  table: smartcaptureTable,
} as const);
