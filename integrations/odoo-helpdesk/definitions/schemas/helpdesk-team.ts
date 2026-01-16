import { z } from '@botpress/sdk'

export const helpdeskTeamSchema = z.object({
  name: z.string().describe('The name of the helpdesk team'),
  id: z.number().describe('The id of the helpdesk team'),
})

export type HelpdeskTeam = z.infer<typeof helpdeskTeamSchema>

const helpdeskTeamPayloadSchema = z.object({
  name: z.string().describe('The name of the helpdesk team'),
})

export type HelpdeskTeamPayload = z.infer<typeof helpdeskTeamPayloadSchema>