import { middyfy } from '@mex/middy-utils';
import { CaptureConfigHandler } from './handlers/captureConfig';
import { CaptureVariablesHandler } from './handlers/captureVariable';

const captureVariablesHandler = new CaptureVariablesHandler();
const captureConfigHandler = new CaptureConfigHandler();

export const main = middyfy(captureVariablesHandler.execute);
export const config = middyfy(captureConfigHandler.execute);
