import merge from 'deepmerge';

export const combineMerge = (target, source, options) => {
  const destination = target.slice();
  const text = {};
  source.forEach((item, index) => {
    if (typeof destination[index] === 'undefined') {
      destination[index] = options.cloneUnlessOtherwiseSpecified(item, options);
    } else if (options.isMergeableObject(item)) {
      destination[index] = merge(target[index], item, options);
    } else if (target.indexOf(item) === -1) {
      destination.push(item);
    }
  });
  return destination;
};

export const serializeConfig = (config) => {
  return {
    order: config.map((label) => label.id),
    data: config.reduce((acc, val) => {
      return {
        ...acc,
        [val.id]: val,
      };
    }, {}),
  };
};

export const serializeConfigDelete = (config) => {
  return config.reduce((acc, val) => {
    return {
      ...acc,
      [val.id]: undefined,
    };
  }, {});
};
