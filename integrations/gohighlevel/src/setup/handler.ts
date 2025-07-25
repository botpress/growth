import type { Handler } from '../misc/types'

export const handler: Handler = async ({ req, client: _client, logger: _logger }) => {
  if (!req.body) {
    console.warn('Handler received an empty body')
    return {}
  }
  
  return {}
}