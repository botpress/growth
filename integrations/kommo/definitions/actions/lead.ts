import { z } from '@bpinternal/zui'
import { ActionDefinition } from '@botpress/sdk'

// Lead Schema: defines what a Kommo lead looks like in Botpress
// This is a simplified version: we only expose the fields bots need

export const leadSchema = z.object({
  id: z.number().describe('Lead ID'),
  name: z.string().describe('Lead name'),
  price: z.number().optional().describe('Lead value in dollars'),
  responsibleUserId: z.number().optional().describe('User responsible for this lead'),
  pipelineId: z.number().optional().describe('Which sales pipeline'),
  statusId: z.number().optional().describe('Which stage in the pipeline'),
  createdAt: z.number().describe('When created (Unix timestamp)'),
  updatedAt: z.number().describe('When last updated (Unix timestamp)'),
})

/**
 * Create Lead Action
 * Creates a new lead in Kommo CRM
 */
const createLead: ActionDefinition = {
  title: 'Create Lead',
  description: 'Creates a new lead in Kommo CRM',
  input: {
    schema: z.object({
      name: z.string().describe('Lead name (required)'),
      price: z.number().optional().describe('Lead value in dollars'),
      responsibleUserId: z.number().optional().describe('User ID to assign this lead to'),
      pipelineId: z.number().optional().describe('Pipeline ID (defaults to main pipeline)'),
      statusId: z.number().optional().describe('Initial status/stage ID'),
    }),
  },
  output: {
    schema: z.object({
      lead: leadSchema,
    }),
  },
}

/**
 * Get Lead Action
 * Retrieves a lead by its ID
 */
const getLead: ActionDefinition = {
  title: 'Get Lead',
  description: 'Retrieves a lead by ID from Kommo',
  input: {
    schema: z.object({
      leadId: z.number().describe('The ID of the lead to retrieve'),
    }),
  },
  output: {
    schema: z.object({
      lead: leadSchema.optional().describe('The lead (undefined if not found)'),
    }),
  },
}

/**
 * Update Lead Action
 * Updates an existing lead's information
 */
const updateLead: ActionDefinition = {
  title: 'Update Lead',
  description: 'Updates an existing lead in Kommo',
  input: {
    schema: z.object({
      leadId: z.number().describe('Lead ID to update'),
      name: z.string().optional().describe('New name'),
      price: z.number().optional().describe('New price'),
      responsibleUserId: z.number().optional().describe('New responsible user'),
      pipelineId: z.number().optional().describe('New pipeline ID'),
      statusId: z.number().optional().describe('New status/stage ID'),
    }),
  },
  output: {
    schema: z.object({
      lead: leadSchema,
    }),
  },
}

/**
 * Move Lead Action
 * Moves a lead to a different pipeline stage
 */
const moveLead: ActionDefinition = {
  title: 'Move Lead',
  description: 'Moves a lead to a different pipeline stage',
  input: {
    schema: z.object({
      leadId: z.number().describe('Lead ID to move'),
      statusId: z.number().describe('New status/stage ID'),
      pipelineId: z.number().describe('Pipeline ID'),
    }),
  },
  output: {
    schema: z.object({
      lead: leadSchema,
    }),
  },
}

// Export all lead actions
export const actions = {
  createLead,
  getLead,
  updateLead,
  moveLead,
} as const
