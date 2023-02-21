import { Container } from 'inversify';
import { CaptureHandler } from './Capture';
import { ConfigHandler } from './Config';
import { VariableHandler } from './Variable';

const container = new Container({ defaultScope: 'Singleton' });

container.bind<ConfigHandler>(ConfigHandler).to(ConfigHandler);
container.bind<VariableHandler>(VariableHandler).to(VariableHandler);
container.bind<CaptureHandler>(CaptureHandler).to(CaptureHandler);

export { container };
