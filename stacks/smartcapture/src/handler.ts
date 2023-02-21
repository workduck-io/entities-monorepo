import { middyfy } from '@mex/middy-utils';
import { CaptureHandler } from './handlers/Capture';
import { CaptureConfigHandler } from './handlers/captureConfig';
import { CaptureVariablesHandler } from './handlers/captureVariable';

const captureVariablesHandler = new CaptureVariablesHandler();
const captureConfigHandler = new CaptureConfigHandler();
const captureHandler = new CaptureHandler();

export const main = middyfy(captureVariablesHandler.execute);
export const config = middyfy(captureConfigHandler.execute);
export const capture = middyfy(captureHandler.execute);
