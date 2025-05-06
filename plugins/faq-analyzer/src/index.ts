import * as bp from '.botpress'

// plugin client (it's just the botpress client) --> no need for vanilla
const getTableClient = (botClient: bp.Client): any => {
  return botClient as any;
}

const plugin = new bp.Plugin({
  actions: {},
})

plugin.on.beforeIncomingMessage("*", async (props) => {
  const schema = {
    question: { type: 'string', searchable: true, nullable: true },
    count: { type: 'number', nullable: true }
  }
  
  try {
    let tableName = (props.configuration as { tableName?: string }).tableName ?? 'QuestionTable'
    tableName = tableName.replace(/\s+/g, '')
    
    if (!tableName || /^\d/.test(tableName)) {
      props.logger.error('Table name must not start with a number. FAQ Table will not be created.')
      return undefined
    }

    if (!tableName.endsWith('Table')) {
      tableName += 'Table'
    }

    props.logger.info(`Creating table "${tableName}" with schema ${JSON.stringify(schema)}`)
    
    const tableClient = getTableClient(props.client)
    
    try {
      await tableClient.getOrCreateTable({
        table: tableName,
        schema,
      })
      
      await tableClient.setState({ 
        type: 'bot', 
        id: props.ctx.botId, 
        name: 'table', 
        payload: { tableCreated: true } 
      })
      
    } catch (err) {
      if (err instanceof Error) {
        props.logger.warn(`Table creation attempt: ${err.message}`)
      } else {
        props.logger.warn(`Table creation attempt: ${String(err)}`)
      }
      try {
        await tableClient.setState({ 
          type: 'bot', 
          id: props.ctx.botId, 
          name: 'table', 
          payload: { tableCreated: true } 
        })
      } catch (stateErr) {
        if (stateErr instanceof Error) {
          props.logger.warn(`Failed to set state: ${stateErr.message}`)
        } else {
          props.logger.warn(`Failed to set state: ${String(stateErr)}`)
        }
      }
    }
  } catch (err) {
    if (err instanceof Error) {
    props.logger.error(`Failed to initialize table: ${err.message}`)
    } else {
      props.logger.error(`Failed initialize table: ${String(err)}`)
    }
  }
  
  return undefined
})

export default plugin