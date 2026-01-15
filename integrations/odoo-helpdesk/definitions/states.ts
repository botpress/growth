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

export const states = {
  helpdeskIntegrationInfo,
} as const satisfies Record<string, StateDefinition>
