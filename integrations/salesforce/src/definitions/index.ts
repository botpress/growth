import { contactActionDefinitions } from './contact-actions'
import { leadActionDefinitions } from './lead-actions'
import { apiActionDefinitions } from './api-actions'
import { caseActionDefinitions } from './case-actions'

export const actionDefinitions = {
  ...contactActionDefinitions,
  ...leadActionDefinitions,
  ...apiActionDefinitions,
  ...caseActionDefinitions,
}
