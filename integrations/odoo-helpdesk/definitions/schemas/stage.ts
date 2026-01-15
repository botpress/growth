import { z } from '@botpress/sdk'

export const stageSchema = z.object({
  name: z.string().describe('The name of the stage'),
  id: z.number().describe('The id of the stage'),
  teamIds: z.array(z.number()).describe('The ids of the helpdesk teams that the stage belongs to'),
})