import { IntegrationDefinition, z } from '@botpress/sdk';
import { integrationName } from './package.json';

export default new IntegrationDefinition({
  name: integrationName ?? 'apify',
  version: '1.0.0',
  title: 'Apify Website Content Crawler',
  readme: 'hub.md',
  icon: 'icon.svg',
  description:
    'Integrate your Botpress chatbot with Apify to crawl websites and extract content. Uses webhooks for reliable, asynchronous crawling and automatically syncs content to Botpress files.',
  configuration: {
    schema: z.object({
      apiToken: z.string().describe('Your Apify API Token (starts with apify_api_)'),
      webhookSecret: z.string().optional().describe('A secret token to secure your webhook URL (recommended)'),
    }),
  },
  events: {
    crawlerCompleted: {
      title: 'Crawler Completed',
      description: 'Triggered when an Apify crawler run completes successfully',
      schema: z.object({
        actorId: z.string().describe('ID of the triggering Actor'),
        actorTaskId: z.string().optional().describe('If task was used, its ID'),
        actorRunId: z.string().describe('ID of the triggering Actor run'),
        eventType: z.string().describe('Type of webhook event (e.g., ACTOR.RUN.SUCCEEDED)'),
        runId: z.string().describe('Alias for actorRunId for easier access'),
        itemsCount: z.number().optional().describe('Number of items crawled'),
        filesCreated: z.number().optional().describe('Number of files created in Botpress'),
        syncTargetPath: z.string().optional().describe('Path where results were synced'),
      }),
    },
  },
  user: {
    tags: {
      id: {
        title: 'Apify API Token',
      },
    },
  },
  channels: {},
  actions: {
    startCrawlerRun: {
      title: 'Start Crawler Run',
      description: 'Start a crawler run asynchronously. Use with webhooks for production crawling. You can either use individual parameters for simple cases, or provide rawInputJsonOverride for full control.',
              input: {
        schema: z.object({
          startUrls: z.array(z.string().url()).describe('URLs to start crawling from'),
          excludeUrlGlobs: z.array(z.string()).optional().describe('URL patterns to exclude from crawling'),
          includeUrlGlobs: z.array(z.string()).optional().describe('URL patterns to include in crawling'),
          maxCrawlPages: z.number().min(1).max(10000).optional().describe('Maximum number of pages to crawl'),
          saveMarkdown: z.boolean().optional().describe('Save content as Markdown format'),
          htmlTransformer: z.enum(['readableTextIfPossible', 'readableText', 'minimal', 'none']).optional().describe('HTML processing method'),
          removeElementsCssSelector: z.string().optional().describe('CSS selectors for elements to remove'),
          crawlerType: z.enum(['playwright:adaptive', 'playwright:firefox', 'cheerio', 'jsdom', 'playwright:chrome']).optional().describe('Browser type for crawling'),
          expandClickableElements: z.boolean().optional().describe('Expand clickable elements for better content extraction'),
          headers: z.string().optional().describe('Custom HTTP headers for authentication/requests'),
          rawInputJsonOverride: z.string().optional().describe('JSON string to override any crawler parameters'),
        }),
      },
      output: {
        schema: z.object({
          success: z.boolean(),
          message: z.string(),
          data: z.object({
            runId: z.string().optional(),
            status: z.string().optional(),
            error: z.string().optional(),
          }).optional(),
        }),
      },
    },
    getRunStatus: {
      title: 'Get Run Status',
      description: 'Check the status of a crawler run (useful for monitoring)',
      input: {
        schema: z.object({
          runId: z.string().describe('The run ID to check status for'),
        }),
      },
      output: {
        schema: z.object({
          success: z.boolean(),
          message: z.string(),
          data: z.object({
            runId: z.string().optional(),
            status: z.string().optional(),
            startedAt: z.string().nullable().optional(),
            finishedAt: z.string().nullable().optional(),
            defaultDatasetId: z.string().nullable().optional(),
            error: z.string().optional(),
          }).optional(),
        }),
      },
    },
    syncRunResults: {
      title: 'Sync Run Results',
      description: 'Get the results from a completed crawler run and optionally sync to Botpress files',
      input: {
        schema: z.object({
          runId: z.string().describe('The run ID to get results for'),
          syncTargetPath: z.string().optional().describe('Botpress file path where content will be saved (optional)'),
        }),
      },
      output: {
        schema: z.object({
          success: z.boolean(),
          message: z.string(),
          data: z.object({
            runId: z.string().optional(),
            datasetId: z.string().optional(),
            itemsCount: z.number().optional(),
            filesCreated: z.number().optional(),
            syncTargetPath: z.string().optional(),
            error: z.string().optional(),
          }).optional(),
        }),
      },
    },

  },
});
