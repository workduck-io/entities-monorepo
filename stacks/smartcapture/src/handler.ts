import { middyfy } from '@mex/middy-utils';
import { CaptureConfigHandler } from './handlers/captureConfig';
import { CaptureVariablesHandler } from './handlers/captureVariable';

const handlerPairs = new CaptureVariablesHandler();
const configHandlerPairs = new CaptureConfigHandler();

export const main = middyfy(handlerPairs);
export const config = middyfy(configHandlerPairs);
