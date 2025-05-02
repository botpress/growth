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
  await table.createTableIfNotExist(props, schema)
  return undefined
})

export default plugin