import merge from 'deepmerge';
import { Smartcapture } from '../src/interface';

export const combineMerge = (target, source, options) => {
  const destination = target.slice();

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

export const serializeLabel = (labels) => {
  const map = new Map<string, Smartcapture[]>();
  labels.map((label) => {
    const labelArr = map.get(label.webPage);
    if (labelArr) {
      labelArr.push(label);
      map.set(label.webPage, labelArr);
    } else map.set(label.webPage, [label]);
  });

  return Object.fromEntries(map);
};
