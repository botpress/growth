import { z } from '@botpress/sdk'

export const prioritySchema = z.object({
  name: z.string().describe('The name of the priority'),
  id: z.number().describe('The id of the priority'),
})

export type Priority = z.infer<typeof prioritySchema>

const priorityPayloadSchema = z.object({
  id: z.number().describe('The id of the priority'),
})

export type PriorityPayload = z.infer<typeof priorityPayloadSchema>
