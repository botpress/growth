import { z } from '@botpress/sdk'

export const stageSchema = z.object({
  id: z.number().describe('The id of the stage'),
  name: z.string().describe('The name of the stage'),
  teamIds: z.array(z.number()).describe('The ids of the helpdesk teams that the stage belongs to'),
})

export const fetchStagesResultsSchema = z.array(
  z.object({
    id: z.number().describe('The id of the stage'),
    name: z.string().describe('The name of the stage'),
    team_ids: z.array(z.number()).describe('The ids of the helpdesk teams that the stage belongs to'),
  })
)

export type Stage = z.infer<typeof stageSchema>
export type FetchStagesResults = z.infer<typeof fetchStagesResultsSchema>
