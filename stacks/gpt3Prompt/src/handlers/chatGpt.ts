import { extractUserIdFromToken, extractWorkspaceId } from '@mex/gen-utils';
import { ValidatedAPIGatewayProxyHandler } from '@workduck-io/lambda-routing';
import {
  convertToChatCompletionRequest,
  validateUsageAndExecutePrompt,
} from '../../utils/helpers';
import { SystemPrompt } from '../../utils/prompts';
import { ChatGPTPromptCreationRequest } from '../interface';

export const chatGPTPrompt: ValidatedAPIGatewayProxyHandler<
  ChatGPTPromptCreationRequest
> = async (event) => {
  const { context, input, output } = event.body;
  const workspaceId = extractWorkspaceId(event);
  const userId = extractUserIdFromToken(event);
  try {
    const result = await validateUsageAndExecutePrompt(
      workspaceId,
      userId,
      async (openai) => {
        return (
          await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [
              SystemPrompt,
              ...context.map(convertToChatCompletionRequest(input, output)),
            ],
          })
        ).data;
      }
    );

    return result;
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify(err),
    };
  }
};
