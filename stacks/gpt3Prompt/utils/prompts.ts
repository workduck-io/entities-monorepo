import { ChatCompletionRequestMessage } from 'openai';

export const SystemPrompt: ChatCompletionRequestMessage = {
  role: 'system',
  content:
    'You are a helpful AI bot that helps the user perform generative text actions in a professional environment',
};

export const Prompts = {
  SUMMARIZE:
    'Summarize the text in a maximum of half the total number of words provided as input.',
  EXPAND: 'Continue the chain of thought.',
  EXPLAIN: 'Explain the text as you would to an average 13 year old.',
  ACTIONABLE: 'Convert the text into actionable bullet points.',
};

export const PromptOutputFormat = {
  MARKDOWN: 'The output must be in markdown format.',
};

export const PromptInputFormat = {
  MARKDOWN: 'The input is in markdown format.',
};
