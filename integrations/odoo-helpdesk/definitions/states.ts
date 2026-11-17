import { z, StateDefinition } from '@botpress/sdk'
import { helpdeskTeamSchema, stageSchema } from './schemas'

const helpdeskIntegrationInfo = {
  type: 'integration' as const,
  schema: z.object({
    helpdeskIntegrationInfo: z
      .object({
        helpdeskTeams: z.array(helpdeskTeamSchema),
        stages: z.array(stageSchema),
      })
      .title('Helpdesk Integration Info')
      .describe('Helpdesk integration info populated during registration'),
  }),
}

const customerIdMapping = {
  type: 'integration' as const,
  schema: z.object({
    customerIdMapping: z
      .record(z.string(), z.number())
      .title('Customer ID Mapping')
      .describe('Maps Botpress customer IDs to Odoo customer IDs'),
  }),
}

export const states = {
  helpdeskIntegrationInfo,
  customerIdMapping,
} as const satisfies Record<string, StateDefinition>
