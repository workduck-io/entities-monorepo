import { initializeEntity } from '@mex/entity-utils';
import { reminderTable } from '../service/DynamoDB';

export const ReminderEntity = initializeEntity({
  name: 'reminder',
  table: reminderTable,
} as const);
