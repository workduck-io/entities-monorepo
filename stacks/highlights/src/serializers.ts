import {
  defaultEntityDeserializer,
  defaultEntitySerializer,
} from '@mex/gen-utils';
import { Highlights } from './interface';
import { AdvancedElements } from '@mex/entity-utils';

export const highlightSerializer = (
  highlight: AdvancedElements
): Partial<Highlights> => {
  return defaultEntitySerializer<AdvancedElements, Highlights>({
    properties: highlight.properties,
    createdAt: highlight.createdAt,
  });
};

export const highlightDeserializer = (
  highlight: Partial<Highlights>
): AdvancedElements => {
  return defaultEntityDeserializer<Highlights, AdvancedElements>(
    {
      properties: highlight.properties,
      createdAt: highlight.createdAt,
    },
    {
      callback: (data) => {
        return { ...data, entityRefID: highlight.entityId };
      },
    }
  );
};

export const deserializeMultipleHighlights = (arr: any[]) =>
  arr.reduce((acc, item) => {
    acc.push(highlightDeserializer(item));
    return acc;
  }, []);
