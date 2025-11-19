import type { IntegrationContext } from '@botpress/sdk'
import type * as botpress from '.botpress'
import type { Configuration } from '.botpress/implementation/configuration'

export type Config = botpress.configuration.Configuration
export type Implementation = ConstructorParameters<typeof botpress.Integration>[0]
export type IntegrationCtx = IntegrationContext<Configuration>
