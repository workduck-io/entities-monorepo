import { Container } from 'inversify';
import { ConfigHandler } from './Config';
import { VariableHandler } from './Variable';

const container = new Container({ defaultScope: 'Singleton' });

container.bind<ConfigHandler>(ConfigHandler).to(ConfigHandler);
container.bind<VariableHandler>(VariableHandler).to(VariableHandler);

export { container };
