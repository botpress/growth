import * as bp from '.botpress'
import { createContact } from './createContact'
import { updateContact } from './updateContact'
import { searchContact } from './searchContact'
import { enrichPerson } from './enrichPerson'
import { bulkEnrichPeople } from './bulkEnrichPeople'

export default {
  createContact,
  updateContact,
  searchContact,
  enrichPerson,
  bulkEnrichPeople,
} satisfies bp.IntegrationProps['actions']