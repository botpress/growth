import { JiraApi } from '../client'
import type * as bp from '../../.botpress'

export const getClient = (config: bp.configuration.Configuration) =>
  new JiraApi(config.host, config.email, config.apiToken)
