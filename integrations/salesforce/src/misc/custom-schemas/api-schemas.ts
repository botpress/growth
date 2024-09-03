import { z } from "@botpress/sdk";

export const MakeApiRequestInputSchema = z.object({
  method: z.string(),
  path: z
    .string()
    .describe("yourinstance.salesforce.com/services/data/v54.0/PATH"),
  headers: z.string().optional().describe("Headers in JSON format"),
  params: z.string().optional().describe("Params in JSON format"),
  requestBody: z.string().optional().describe("Request body in JSON format"),
});
