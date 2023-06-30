import { extractUserIdFromToken, extractWorkspaceId } from '@mex/gen-utils';
import { ValidatedAPIGatewayProxyHandler } from '@workduck-io/lambda-routing';
import {
  preparePromptRequestFromContext,
  validateUsageAndExecutePrompt,
} from '../../utils/helpers';
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
          await openai.createChatCompletion(
            preparePromptRequestFromContext(context, input, output)
          )
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
