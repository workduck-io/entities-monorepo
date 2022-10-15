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
