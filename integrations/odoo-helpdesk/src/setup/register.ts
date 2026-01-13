import * as bp from '.botpress'
import { print } from 'src/utils'

export const register: bp.IntegrationProps['register'] = async (params) => {
  print(`Registering Odoo Helpdesk Integration...`)
  print(`Params: ${JSON.stringify(params)}`)
}