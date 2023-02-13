import { middyfy } from '@mex/middy-utils';
import { container } from './handlers/inversify.config';
import { ReminderHandler } from './handlers/reminder';

const reminderHandler = container.get(ReminderHandler);
export const main = middyfy(reminderHandler.execute);
