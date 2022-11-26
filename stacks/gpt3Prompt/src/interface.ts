import { BaseEntityParameters, GenericObject } from '@mex/entity-utils';

export interface Gpt3Prompt extends BaseEntityParameters {
  title: string;
  description: string;
  prompt: string;
  properties: {
    model: string;
    max_tokens: number;
    temperature: number;
    iterations: number;
  };
  category: string;
  isPublic: boolean;
  tags: string[];
  createdBy: string;
  createdByData?: {
    username: string;
    email: string;
    image: string;
  };
  createdAt?: string;
  updatedAt?: string;
  // input for the prompt as key value pairs
  input?: GenericObject;
  downloadedBy?: string[];
  imageUrls?: string[];
  views?: number;
  likes?: number;
  version?: number;
}
