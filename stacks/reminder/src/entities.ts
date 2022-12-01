import { defaultEntityAttributes } from '@mex/entity-utils';
import { Entity } from 'dynamodb-toolbox';
import { reminderTable } from '../service/DynamoDB';

export const ReminderEntity = new Entity({
  name: 'reminder',
  attributes: {
    ...defaultEntityAttributes,
  },
  table: reminderTable,
} as const);
