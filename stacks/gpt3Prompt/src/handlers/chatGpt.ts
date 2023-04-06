import { ValidatedAPIGatewayProxyHandler } from '@workduck-io/lambda-routing';
import {
  convertToChatCompletionRequest,
  openaiInstance,
} from '../../utils/helpers';
import { SystemPrompt } from '../../utils/prompts';
import { ChatGPTPromptCreationRequest } from '../interface';

export const chatGPTPrompt: ValidatedAPIGatewayProxyHandler<
  ChatGPTPromptCreationRequest
> = async (event) => {
  const { context, input, output } = event.body;
  const instance = openaiInstance(process.env.OPENAI_API_KEY);
  try {
    const result = await instance.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        SystemPrompt,
        ...context.map(convertToChatCompletionRequest(input, output)),
      ],
    });
    return {
      statusCode: 200,
      body: JSON.stringify(result.data.choices[0].message),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify(err),
    };
  }
};
