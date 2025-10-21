import * as bp from '.botpress'

export type ValueOf<T> = T[keyof T]

export type Channel = ValueOf<bp.IntegrationProps['channels']>
export type MessageHandler = ValueOf<Channel['messages']>
export type MessageHandlerProps = Parameters<MessageHandler>[0]

export type Handler = bp.IntegrationProps['handler']
export type HandlerProps = Parameters<Handler>[0]
