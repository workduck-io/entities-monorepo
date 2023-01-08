import { extractUserIdFromToken } from '@mex/gen-utils';
import { createError } from '@middy/util';
import { ValidatedAPIGatewayProxyHandler } from '@workduck-io/lambda-routing';
import { pickAttributes } from '../../utils/helpers';
import {
  getAllDocuments,
  searchDocumentFromMeiliSearch,
  sortFromMeiliSearch,
  updateDocumentInMeiliSearch,
} from '../../utils/meiliSearchHelper';
import { Gpt3PromptAnalyticsEntity } from '../entities';
import { Gpt3Prompt, SortKey, SortOrder } from '../interface';

import { Categories } from '../../utils/consts';

// Get the analytics of a prompt
export const getPromptAnalyticsHandler: ValidatedAPIGatewayProxyHandler<
  Gpt3Prompt
> = async (event) => {
  const promptId = event.pathParameters?.promptId;

  try {
    const response = await Gpt3PromptAnalyticsEntity.query(
      `PROMPT_${promptId}`,
      {
        beginsWith: 'PROMPT_ANALYTICS_',
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify(response.Items[0]),
    };
  } catch (e) {
    throw createError(400, e.message);
  }
};

// Get all categories for the prompt
export const getCategoriesHandler: ValidatedAPIGatewayProxyHandler<
  Gpt3Prompt
> = async (event) => {
  const categories = {
    id: 1,
    title: 'Categories',
    content: Categories,
  };

  return {
    statusCode: 200,
    body: JSON.stringify(categories),
  };
};

// Liked/Unliked, View/Unview for the prompt
export const likedViewedPromptHandler: ValidatedAPIGatewayProxyHandler<
  Gpt3Prompt
> = async (event) => {
  const { id } = event.pathParameters;
  const userId = extractUserIdFromToken(event);
  // allow likes, views one time per user
  const { likes, views } = event.queryStringParameters as any;

  try {
    // Get analytics
    const analyticsRes: any = (
      await Gpt3PromptAnalyticsEntity.query(`PROMPT_${id}`, {
        beginsWith: 'PROMPT_ANALYTICS_',
      })
    ).Items[0];

    // If userId is present in likes array, then return already liked else add it
    switch (likes) {
      case 'true':
        if (analyticsRes.likes && analyticsRes.likes.includes(userId))
          return {
            statusCode: 200,
            body: JSON.stringify("You've already liked this prompt"),
          };
        else if (
          !analyticsRes.likes ||
          analyticsRes.likes === undefined ||
          analyticsRes.likes === null ||
          (Array.isArray(analyticsRes.likes) && analyticsRes.likes.length === 0)
        ) {
          analyticsRes.likes = [userId];
        } else analyticsRes.likes.push(userId);

        break;
      case 'false':
        if (analyticsRes.likes.includes(userId)) {
          analyticsRes.likes = analyticsRes.likes.filter(
            (like) => like !== userId
          );
        } else
          return {
            statusCode: 200,
            body: JSON.stringify("You've already unliked this prompt"),
          };

        break;
    }

    // switch case for views
    switch (views) {
      case 'true':
        if (analyticsRes.views.includes(userId))
          return {
            statusCode: 200,
            body: JSON.stringify("You've already viewed this prompt"),
          };
        else analyticsRes.views.push(userId);

        break;
      case 'false':
        if (analyticsRes.views.includes(userId))
          analyticsRes.views = analyticsRes.views.filter(
            (view) => view !== userId
          );
        else
          return {
            statusCode: 200,
            body: JSON.stringify("You've already unviewed this prompt"),
          };

        break;
    }

    const analyticsUpdateRes: any = (
      await Gpt3PromptAnalyticsEntity.update(
        {
          ...pickAttributes(analyticsRes, [
            'analyticsId',
            'promptId',
            'createdBy',
            'views',
            'likes',
          ]),
        },
        {
          returnValues: 'ALL_NEW',
        }
      )
    ).Attributes;

    // Update MeiliSearch document
    const updateMeiliSearchRes = await updateDocumentInMeiliSearch({
      mid: analyticsUpdateRes.promptId,
      likes: analyticsUpdateRes.likes ? analyticsUpdateRes.likes.length : 0,
      views: analyticsUpdateRes.views ? analyticsUpdateRes.views.length : 0,
    });

    if (analyticsUpdateRes && updateMeiliSearchRes) {
      return {
        statusCode: 200,
        body: JSON.stringify(analyticsUpdateRes),
      };
    } else throw createError(400, 'Error updating prompt');
  } catch (e) {
    throw createError(400, e.message);
  }
};

// Home Page Dashboard for the prompt
// Today's Prompt - Get the prompt with the latest createdAt within the last 24 hours
// Most Downloaded Prompt - Get the prompt with the most downloads
// Popular Weekly Prompt - Get the prompt with the most views within the last 7 days
// Trending Prompts - Get the prompt with the weighted score of likes, views and downloads in descending order
// Weighted Score = (likes * 1) + (views * 0.5) + (downloads * 0.25)
export const homeDashboardHandler: ValidatedAPIGatewayProxyHandler<
  Gpt3Prompt
> = async (event) => {
  const homePrompts: any = {
    todayPrompts: {
      title: `Today's Pick`,
      content: [],
    },
    mostDownloadedPrompts: {
      title: 'Most Downloaded',
      content: [],
    },
    popularWeeklyPrompts: {
      title: 'Popular Weekly',
      content: [],
    },
    trendingPrompts: {
      title: 'Trending Prompts',
      content: [],
    },
  };

  const currentTime = Date.now();
  const last24Hours = currentTime - 24 * 60 * 60 * 1000;
  const last7Days = currentTime - 7 * 24 * 60 * 60 * 1000;
  let filter24H = `${SortKey.CREATED_AT} >= ${last24Hours} AND ${SortKey.CREATED_AT} <= ${currentTime}`;
  let filter7D = `${SortKey.CREATED_AT} >= ${last7Days} AND ${SortKey.CREATED_AT} <= ${currentTime}`;
  let filterUser = `createdBy.id = ${userId}`;

  // Make parallel requests for todayPrompts, mostDownloadedPrompts, popularWeeklyPrompts and trendingPrompts
  const [
    getAllPrompts,
    mostDownloadedPrompts,
    popularWeeklyPrompts,
    todayPrompts,
  ]: any = await Promise.all([
    getAllDocuments(),
    sortFromMeiliSearch(SortKey.DOWNLOADS, SortOrder.DESC),
    sortFromMeiliSearch(SortKey.VIEWS, SortOrder.DESC, filter7D, 20),
    sortFromMeiliSearch(SortKey.CREATED_AT, SortOrder.DESC, filter24H, 20),
  ]);

  homePrompts.todayPrompts.content = todayPrompts;
  homePrompts.mostDownloadedPrompts.content = mostDownloadedPrompts;
  homePrompts.popularWeeklyPrompts.content = popularWeeklyPrompts;

  const weightedScore = getAllPrompts.map((prompt: any) => {
    const score =
      prompt.likes * 1 + prompt.views * 0.5 + prompt.downloads * 0.25;
    return {
      ...prompt,
      score,
    };
  });

  // Sort the prompts based on the weighted score
  homePrompts.trendingPrompts.content = weightedScore.sort(
    (a: any, b: any) => b.score - a.score
  );

  try {
    return {
      statusCode: 200,
      body: JSON.stringify(homePrompts),
    };
  } catch (error) {
    throw createError(400, error.message);
  }
};

export const recentPromptsHandler: ValidatedAPIGatewayProxyHandler<
  Gpt3Prompt
> = async (event) => {
  try {
    const userId = extractUserIdFromToken(event);

    const recentPrompts = {
      title: 'Your Recent Prompts',
      content: [],
    };

    const filterUser = `createdBy.id = ${userId}`;
    const userRecentPrompts = await sortFromMeiliSearch(
      SortKey.CREATED_AT,
      SortOrder.DESC,
      filterUser,
      20
    );
    recentPrompts.content = userRecentPrompts;

    return { statusCode: 200, body: JSON.stringify(recentPrompts) };
  } catch (error) {
    throw createError(400, error.message);
  }
};
// Search for a prompt
export const searchPromptHandler: ValidatedAPIGatewayProxyHandler<
  Gpt3Prompt
> = async (event) => {
  const { query, filters, sort, limit } = event.body as any;

  try {
    const results = await searchDocumentFromMeiliSearch(
      query,
      filters,
      sort,
      limit
    );
    return {
      statusCode: 200,
      body: JSON.stringify(results),
    };
  } catch (e) {
    throw createError(400, e.message);
  }
};
