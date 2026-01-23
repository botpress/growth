import * as bp from '.botpress'
import { createLead, getLead, updateLead, moveLead, createContact, getContact } from './actions'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},

  actions: {
    createLead,
    getLead,
    updateLead,
    moveLead,
    createContact,
    getContact,
  },
  channels: {},
  handler: async () => {},
})
