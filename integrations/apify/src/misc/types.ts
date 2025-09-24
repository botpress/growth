import type * as botpress from '.botpress'
import { startCrawlerRunInputSchema } from '../../integration.definition'
import { z } from '@botpress/sdk'

type Implementation = ConstructorParameters<typeof botpress.Integration>[0]

export type RegisterFunction = Implementation['register']
export type UnregisterFunction = Implementation['unregister']
export type Handler = Implementation['handler']

export type ApifyCrawlerParams = z.infer<typeof startCrawlerRunInputSchema>;
export type CrawlerRunInput = Omit<ApifyCrawlerParams, 'rawInputJsonOverride'|'startUrls'> & { startUrls: { url: string }[] }