import type * as botpress from '.botpress'
type Implementation = ConstructorParameters<typeof botpress.Integration>[0]

export type RegisterFunction = Implementation['register']
export type UnregisterFunction = Implementation['unregister']
export type Handler = Implementation['handler']