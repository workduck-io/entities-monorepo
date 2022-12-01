import { BaseEntityParameters, GenericObject } from '@mex/entity-utils';

export interface Gpt3Prompt extends BaseEntityParameters {
  title: string;
  description: string;
  //Actual prompt
  prompt: string;
  properties: {
    // model by default is text-davinci-003
    model: string;
    // maximum number of tokens to generate in the completion.
    max_tokens: number;
    // 0.9 for more creative applications, and 0 (argmax sampling) for ones with a well-defined answer.
    temperature: number;
    // completions to generate for each prompt.
    iterations: number;
    // Weigtt of the prompt in the completion. 0 (default) is a standard prompt, the higher the weight, the original prompt is diluted.
    weight: number;
  };
  category: string;
  isPublic: boolean;
  tags: string[];
  // Variables input by the user
  input?: GenericObject;
  imageUrls?: string[];
  // showcase is a list of example output of the prompts that are showcased in this prompt
  showcase?: Array<string>;
  analyticsId: string;
  createdBy: string;
  version?: number;
  downloadedBy: Array<string>;
  createdAt?: number;
  updatedAt?: number;
}

export interface Gpt3PromptBody {
  entityId?: string;
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
  input?: GenericObject;
  imageUrls?: string[];
  showcase?: Array<string>;
}

export interface Gpt3PromptAnalytics {
  analyticsId: string;
  promptId: string;
  createdBy: string;
  views: number;
  likes: number;
  downloads: number;
}

export interface MeiliSearchDocument {
  mid: string;
  title: string;
  description: string;
  category: string;
  tags: Array<string>;
  showcase: Array<string>;
  createdBy: {
    name: string;
    email: string;
    alias: string;
  };
  views: number;
  likes: number;
  downloads: number;
}

export interface MeiliSearchDocumentResponse {
  taskUid: number;
  indexUid: string;
  status: string;
  type: string;
  enqueuedAt: Date;
}

export interface MeiliSearchResponse {
  hits: Array<MeiliSearchDocument>;
  offset: number;
  limit: number;
  processingTimeMs: number;
  query: string;
  estimatedTotalHits: number;
}
