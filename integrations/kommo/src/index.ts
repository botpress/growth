import * as bp from '.botpress'
import { createLead, getLead, updateLead, moveLead } from './actions/lead'

export default new bp.Integration({
  register: async () => {
    /**
     * This is called when an integration configuration is saved.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */
    // For now, just accept any configuration
    // TODO: Add validation for baseDomain and accessToken
  },
  unregister: async () => {
    /**
     * This is called when a bot removes the integration.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */
  },
  actions: {
    createLead,
    getLead,
    updateLead,
    moveLead,
  },
  channels: {},
  handler: async () => {},
})
