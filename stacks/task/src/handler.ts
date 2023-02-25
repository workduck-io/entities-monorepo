import { middyfy } from '@mex/middy-utils';
import { TaskHandler } from './handlers/tasks';
import { ViewHandler } from './handlers/view';

const taskHandler = new TaskHandler();
const viewHandler = new ViewHandler();

export const task = middyfy(taskHandler.execute);
export const view = middyfy(viewHandler.execute);
