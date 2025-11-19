import * as bp from '.botpress'

export const unregister: bp.IntegrationProps['unregister'] = async () => {
  /**
   * This is called when a bot removes the integration.
   * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
   */
}
