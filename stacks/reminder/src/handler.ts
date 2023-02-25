import { middyfy } from '@mex/middy-utils';
import { ReminderHandler } from './handlers/reminder';

const reminderHandler = new ReminderHandler();
export const main = middyfy(reminderHandler.execute);
