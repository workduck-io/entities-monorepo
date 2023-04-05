import { ChatCompletionRequestMessage } from 'openai';

export const SystemPrompt: ChatCompletionRequestMessage = {
  role: 'system',
  content:
    'You are a helpful summarizer that sumrmarizes markdown and return result in markdown',
};

export const Prompts = {
  SUMMARIZE:
    'Summarize the text in a maximum of half the total number of words provided as input.',
  EXPAND: 'Continue the chain of thought.',
  EXPLAIN: 'Explain the text as you would to an average 16 year old.',
  ACTIONABLE: 'Convert the text into actionable bullet points.',
};

export const PromptOutputFormat = {
  MARKDOWN: 'The output must be in markdown format.',
};

export const PromptInputFormat = {
  MARKDOWN: 'The input is in markdown format.',
};
