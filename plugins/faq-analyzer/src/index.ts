import * as bp from '.botpress'
import * as client from '@botpress/client'
import * as error from './error'
import * as vanilla from './vanilla-client'
import * as table from './table'

const plugin = new bp.Plugin({
  actions: {},
})

plugin.on.beforeIncomingMessage("*", async (props) => {
  const schema = {
    question: { type: 'string', searchable: true },
    count: { type: 'number' }
  }
  
  try {
    const tableName = props.configuration?.tableName ?? 'QuestionTable'
    props.logger.info(`Creating table "${tableName}" with schema ${JSON.stringify(schema)}`)
    
    try {
      await props.client.getOrCreateTable({
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
  
  return undefined
})

export default plugin