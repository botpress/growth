import { z } from '@botpress/sdk'

export const RecordResultSchema = z.object({
  id: z.string().optional(),
  success: z.boolean(),
  error: z.string().optional(),
})

export const SearchOutputSchema = z.object({
  success: z.boolean(),
  records: z.array(z.object({}).passthrough()).optional(),
  error: z.string().optional(),
})
