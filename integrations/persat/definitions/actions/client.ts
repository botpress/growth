import { ActionDefinition } from '@botpress/sdk'
import {
  ClientResponseSchema,
  ClientSchema,
  CreateClientInputSchema,
  SearchSchema,
  UpdateClientResponseSchema,
} from 'definitions/schemas'

const getClient: ActionDefinition = {
  title: 'Get Client',
  description: 'Retrieves client from their uid_client',
  input: { schema: SearchSchema },
  output: { schema: ClientResponseSchema },
}

const updateClient: ActionDefinition = {
  title: 'Update Client',
  description: 'Update client information',
  input: { schema: ClientSchema },
  output: { schema: UpdateClientResponseSchema },
}

const createClient: ActionDefinition = {
  title: 'Create Client',
  description: 'Create a new client',
  input: { schema: CreateClientInputSchema },
  output: { schema: ClientResponseSchema },
}

export const actions = {
  getClient,
  updateClient,
  createClient,
} as const
