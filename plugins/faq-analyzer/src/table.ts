import _ from 'lodash'
import * as error from './error'
import * as vanilla from './vanilla-client'
import * as bp from '.botpress'

const TABLE_RESERVED_KEYWORDS = ['id', 'createdAt', 'updatedAt']

export const PRIMARY_KEY = '_id'

export const createTableIfNotExist = async (
  props: bp.EventHandlerProps | bp.ActionHandlerProps,
  item: object | undefined
) => {
  if (!item) {
    return
  }

  try {
    const client = vanilla.clientFrom(props.client)
    const schema = escapeObject(item)
    const tableName = props.configuration?.tableName ?? 'QuestionTable'

    props.logger.info(`Creating table "${tableName}" with schema ${JSON.stringify(schema)}`)
    
    try {
      await client.getOrCreateTable({
        table: tableName,
        schema,
      })
      
      await props.client.setState({ 
        type: 'bot', 
        id: props.ctx.botId, 
        name: 'table', 
        payload: { tableCreated: true } 
      })
      
    } catch (err) {
      props.logger.warn(`Table creation attempt: ${err.message}`)
      
      try {
        await props.client.setState({ 
          type: 'bot', 
          id: props.ctx.botId, 
          name: 'table', 
          payload: { tableCreated: true } 
        })
      } catch (stateErr) {
        props.logger.warn(`Failed to set state: ${stateErr.message}`)
      }
    }
  } catch (err) {
    props.logger.error(`Failed to initialize table: ${err.message}`)
  }
}

export const deleteTableIfExist = async (props: bp.EventHandlerProps | bp.ActionHandlerProps) => {
  const { state } = await props.client.getOrSetState({
    type: 'bot',
    id: props.ctx.botId,
    name: 'table',
    payload: { tableCreated: false },
  })

  const { tableCreated } = state.payload
  if (!tableCreated) {
    props.logger.debug(`Table "${props.configuration.tableName}" does not exist`)
    return
  }

  const client = vanilla.clientFrom(props.client)
  props.logger.info(`Deleting table "${props.configuration.tableName}"`)
  await client.deleteTable({
    table: props.configuration.tableName ?? 'QuestionTable',
  })

  await props.client.setState({ type: 'bot', id: props.ctx.botId, name: 'table', payload: { tableCreated: false } })
}

export const escapeObject = (obj: object): object => {
  return _(obj)
    .toPairs()
    .map(([key, value]) => [escapeKey(key), value])
    .fromPairs()
    .value()
}

export const unescapeObject = (obj: object): object => {
  return _(obj)
    .toPairs()
    .map(([key, value]) => [unescapeKey(key), value])
    .fromPairs()
    .value()
}

export const escapeKey = (key: string): string => (TABLE_RESERVED_KEYWORDS.includes(key) ? `_${key}` : key)

export const unescapeKey = (key: string): string => {
  const escapedColumns = TABLE_RESERVED_KEYWORDS.map(escapeKey)
  return escapedColumns.includes(key) ? key.slice(1) : key
}
