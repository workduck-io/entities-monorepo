import { ValidatedAPIGatewayProxyHandler } from '@workduck-io/lambda-routing';
import { openaiInstance } from '../../utils/helpers';

export const chatGPTPrompt: ValidatedAPIGatewayProxyHandler<any> = async (
  event
) => {
  console.log(process.env.OPENAI_API_KEY);
  const instance = openaiInstance(process.env.OPENAI_API_KEY);
  try {
    const result = await instance.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful summarizer that sumrmarizes markdown and return result in markdown',
        },
        {
          role: 'user',
          content: `Summarize the following from markdown format and add a relevant heading and return the result in markdown format: ${event.body.message}`,
        },
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
