import { EventDefinition } from '@botpress/sdk'
import { z } from '@bpinternal/zui'

/**
 * Lead Created Event
 * Triggered when a new lead is created in Kommo
 */
const leadCreated: EventDefinition = {
  title: 'Lead Created',
  description: 'Triggered when a new lead is created in Kommo',
  schema: z.object({
    leadId: z.number().describe('Lead ID'),
    name: z.string().describe('Lead name'),
    responsibleUserId: z.number().optional().describe('User responsible for this lead'),
    pipelineId: z.number().describe('Pipeline ID'),
    statusId: z.number().describe('Status/Stage ID'),
    createdAt: z.number().describe('Creation timestamp'),
  }),
}

/**
 * Lead Status Changed Event
 * Triggered when a lead moves to a new pipeline stage
 */
const leadStatusChanged: EventDefinition = {
  title: 'Lead Status Changed',
  description: 'Triggered when a lead moves to a new pipeline stage',
  schema: z.object({
    leadId: z.number().describe('Lead ID'),
    oldStatusId: z.number().describe('Previous status/stage ID'),
    newStatusId: z.number().describe('New status/stage ID'),
    pipelineId: z.number().describe('Pipeline ID'),
    changedAt: z.number().describe('When the change occurred'),
  }),
}

/**
 * Lead Updated Event
 * Triggered when lead data is changed
 */
const leadUpdated: EventDefinition = {
  title: 'Lead Updated',
  description: 'Triggered when lead data is changed',
  schema: z.object({
    leadId: z.number().describe('Lead ID'),
    updatedAt: z.number().describe('When the update occurred'),
  }),
}

/**
 * Lead Assignment Changed Event
 * Triggered when lead is assigned to a different user
 */
const leadAssignmentChanged: EventDefinition = {
  title: 'Lead Assignment Changed',
  description: 'Triggered when lead is assigned to a different user',
  schema: z.object({
    leadId: z.number().describe('Lead ID'),
    oldUserId: z.number().describe('Previous responsible user ID'),
    newUserId: z.number().describe('New responsible user ID'),
    changedAt: z.number().describe('When the change occurred'),
  }),
}

// Export all events
export const events = {
  leadCreated,
  leadStatusChanged,
  leadUpdated,
  leadAssignmentChanged,
} as const
