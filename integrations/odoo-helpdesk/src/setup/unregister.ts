import * as bp from '.botpress'
import { print } from 'src/utils'

export const unregister: bp.IntegrationProps['unregister'] = async (params) => {
  print(`Unregistering Odoo Helpdesk Integration...`)
  print(`Params: ${JSON.stringify(params)}`)
}