import { Container } from 'inversify';
import { ReminderHandler } from './reminder';

const container = new Container({ defaultScope: 'Singleton' });

container.bind<ReminderHandler>(ReminderHandler).to(ReminderHandler);

export { container };
