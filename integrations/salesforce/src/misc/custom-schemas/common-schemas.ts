import { z } from "@botpress/sdk";

export const RecordResultSchema = z.object({
  id: z.string().optional(),
  success: z.boolean(),
  error: z.string().optional(),
});
