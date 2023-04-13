import {
  AdvancedElements,
  BaseEntityParameters,
  GenericObject,
} from '@mex/entity-utils';

export interface Highlights extends BaseEntityParameters {
  _ct?: string;
  createdAt: number;
  status: string;
  content: GenericObject[];
  sourceUrl: string;
}

export interface HighlightData {
  id?: string;
  data: AdvancedElements;
}
