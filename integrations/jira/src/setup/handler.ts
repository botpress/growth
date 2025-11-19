import * as bp from '../../.botpress'

export const handler: bp.IntegrationProps['handler'] = async ({ req, logger }) => {
  if (!req.body) {
    logger.forBot().warn('Handler received an empty body')
    return
  }
}
