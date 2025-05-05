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
    question: { type: 'string', searchable: true },
    count: { type: 'number' }
  }
  
  try {
    const tableName = 'QuestionTable'
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
      props.logger.warn(`Table creation attempt: ${err.message}`)
      
      try {
        await tableClient.setState({ 
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
  
  return undefined
})

export default plugin