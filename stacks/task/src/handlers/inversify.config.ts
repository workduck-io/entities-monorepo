import { Container } from 'inversify';
import { TaskHandler } from './tasks';
import { ViewHandler } from './view';

const container = new Container({ defaultScope: 'Singleton' });

container.bind<TaskHandler>(TaskHandler).to(TaskHandler);
container.bind<ViewHandler>(ViewHandler).to(ViewHandler);

export { container };
