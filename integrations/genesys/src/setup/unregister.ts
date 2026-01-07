import type { UnregisterFunction } from '../misc/types'

export const unregister: UnregisterFunction = async ({ logger }) => {
  logger.info('Genesys integration unregistered.')
}
