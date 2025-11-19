import type * as botpress from '.botpress'

export type Config = botpress.configuration.Configuration
export type Implementation = ConstructorParameters<typeof botpress.Integration>[0]
