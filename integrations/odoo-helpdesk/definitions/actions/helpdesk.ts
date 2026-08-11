import { z, ActionDefinition } from '@botpress/sdk'
import { helpdeskTeamSchema, stageSchema } from 'definitions/schemas'

export const getHelpdeskTeams: ActionDefinition = {
  title: 'Get Helpdesk Teams',
  description: 'Get all helpdesk teams',
  input: {
    schema: z.object({}),
  },
  output: {
    schema: z.object({
      helpdeskTeams: z.array(helpdeskTeamSchema).title('Helpdesk Teams').describe('The list of helpdesk teams'),
    }),
  },
}

export const getStages: ActionDefinition = {
  title: 'Get Stages',
  description: 'Get all stages',
  input: {
    schema: z.object({
      teamId: z.number().optional().title('Team ID').describe('The id of the team to get the stages for'),
    }),
  },
  output: {
    schema: z.object({
      stages: z.array(stageSchema).title('Stages').describe('The list of stages'),
    }),
  },
}

export const actions = {
  getHelpdeskTeams,
  getStages,
} as const
