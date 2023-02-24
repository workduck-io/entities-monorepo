import { middyfy } from '@mex/middy-utils';
import { ReminderHandler } from './handlers/reminder';

export const main = middyfy(new ReminderHandler().execute);
