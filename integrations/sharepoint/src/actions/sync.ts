import * as bp from '.botpress'

export const addToSync: bp.Integration['actions']['addToSync'] = async ({ client, ctx, input, logger }) => {
  ctx.configuration.documentLibraryNames = 'Peanuts'
  logger.forBot().debug('Manually Syncing to :')
  return {}
}
