import {
  defaultEntityDeserializer,
  defaultEntitySerializer,
} from '@mex/gen-utils';
import { Highlights } from './interface';
import { AdvancedElementEntity } from '@mex/entity-utils';

export const highlightSerializer = (
  highlight: AdvancedElementEntity
): Partial<Highlights> => {
  return defaultEntitySerializer<AdvancedElementEntity, Highlights>(
    highlight.data.elementMetadata,
    {
      props: {
        userId: highlight.data.createdBy,
        createdAt: highlight.data.createdAt,
        sourceUrl: highlight.data.elementMetadata.sourceUrl,
      },
      callback(data) {
        data.properties.saveableRange['text'] = highlight.data.content;
        return data;
      },
    }
  );
};

export const highlightDeserializer = (
  highlight: Partial<Highlights>
): AdvancedElementEntity => {
  return defaultEntityDeserializer(
    {
      id: highlight.entityId,
      data: {
        content: highlight.properties.saveableRange['text'],
        elementType: 'highlight',
        elementMetadata: { ...highlight.properties },
        createdAt: highlight.createdAt ?? new Date(highlight._ct).getTime(),
        createdBy: highlight.userId,
        entityRefID: highlight.entityId,
      },
    },
    {
      callback(data) {
        delete data.data.elementMetadata.saveableRange['text'];
        return data;
      },
    }
  );
};

export const deserializeMultipleHighlights = (arr: any[]) =>
  arr.reduce((acc, item) => {
    acc.push(highlightDeserializer(item));
    return acc;
  }, []);
