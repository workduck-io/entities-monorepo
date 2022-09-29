import { MAX_DYNAMO_BATCH_REQUEST } from './consts';

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

export const chunkify = <T>(
  array: T[],
  chunkSize = MAX_DYNAMO_BATCH_REQUEST
) => {
  const chunkifiedArr: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    chunkifiedArr.push(chunk);
  }
  return chunkifiedArr;
};

type Promisable<T> = T | Promise<T>;

type Iterator<T, U> = (item: T) => Promisable<U>;

export const batchPromises = async <T, U>(
  batchSize: number,
  collection: Promisable<T[]>,
  callback: Iterator<T, U>
): Promise<U[]> => {
  const arr = await Promise.resolve(collection);
  return arr
    .map((_, i) => (i % batchSize ? [] : arr.slice(i, i + batchSize)))
    .map(
      (group) => (res) =>
        Promise.allSettled(group.map(callback)).then((r) => res.concat(r))
    )
    .reduce((chain, work) => chain.then(work), Promise.resolve([]));
};

export default () => process.env.DATA_STORE_ARN.split('/').slice(-1)[0];
