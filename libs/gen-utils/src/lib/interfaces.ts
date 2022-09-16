import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
  Handler,
} from 'aws-lambda';

export type ValidatedAPIGatewayProxyEvent<S> = Omit<
  APIGatewayProxyEventV2,
  'body'
> & {
  body?: S;
};

export type ValidatedAPIGatewayProxyHandler<S> = Handler<
  ValidatedAPIGatewayProxyEvent<S>,
  APIGatewayProxyResult
>;
