export const getEndpoint = () => {
  if (process.env.AWS_EXECUTION_ENV) {
    return undefined;
  } else if (process.env.DYNAMODB_ENDPOINT) {
    return `http://${process.env.DYNAMODB_ENDPOINT}`;
  } else {
    return 'http://localhost:8000';
  }
};

export const getRegion = () => {
  if (process.env.AWS_EXECUTION_ENV) {
    return undefined;
  } else if (process.env.AWS_REGION) {
    return process.env.AWS_REGION;
  } else if (process.env.AWS_DEFAULT_REGION) {
    return process.env.AWS_DEFAULT_REGION;
  } else {
    return 'local';
  }
};

export const chunkify = <T>(array: T[], chunkSize = 25) => {
  const chunkifiedArr: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    chunkifiedArr.push(chunk);
  }
  return chunkifiedArr;
};

export default () => process.env.DATA_STORE_ARN.split('/').slice(-1)[0];
