import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Handler,
} from 'aws-lambda';

export enum HTTPMethod {
  'POST' = 'POST',
  'GET' = 'GET',
  'PUT' = 'PUT',
  'DELETE' = 'DELETE',
  'PATCH' = 'PATCH',
}

export type EventHandlerMap = {
  handler: ValidatedAPIGatewayProxyHandler<any>;
  method: HTTPMethod;
  path: string;
};

export type EventHandlerPairs = {
  [routeKey: string]: ValidatedAPIGatewayProxyHandler<any>;
};

export type ValidatedAPIGatewayProxyEvent<S> = Omit<
  APIGatewayProxyEventV2,
  'body'
> & {
  body?: S;
};

export type ValidatedAPIGatewayProxyHandler<S> = Handler<
  ValidatedAPIGatewayProxyEvent<S>,
  APIGatewayProxyResultV2
>;

export interface WDTokenDecode {
  at_hash: string;
  sub: string;
  email_verified: boolean;
  iss: string;
  'cognito:username': string;
  picture: string;
  'custom:mex_workspace_ids': string;
  origin_jti: string;
  aud: string;
  identities: [
    {
      userId: string;
      providerName: string;
      providerType: string;
      issuer: string | null;
      primary: boolean;
      dateCreated: number;
    }
  ];
  token_use: string;
  auth_time: number;
  name: string;
  exp: number;
  iat: number;
  jti: string;
  email: string;
}
