import { middyfy } from '@mex/middy-utils';
import { container } from './handlers/inversify.config';
import { TaskHandler } from './handlers/tasks';
import { ViewHandler } from './handlers/view';

const taskHandler = container.get(TaskHandler);
const viewHandler = container.get(ViewHandler);

export const task = middyfy(taskHandler.execute);
export const view = middyfy(viewHandler.execute);
