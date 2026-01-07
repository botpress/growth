import * as bp from '.botpress'

export type RegisterFunction = NonNullable<bp.IntegrationProps['register']>
export type UnregisterFunction = NonNullable<bp.IntegrationProps['unregister']>
export type HandlerFunction = NonNullable<bp.IntegrationProps['handler']>
