import { z } from "@botpress/sdk";

export const CreateCaseInputSchema = z.object({
  Subject: z.string().describe("The subject of the case"),
  Description: z.string().describe("The description of the case"),
  Status: z.string().optional().describe("The status of the case"),
  customFields: z.string().displayAs<any>({
    id: 'text',
    params: {
      allowDynamicVariable: true,
      growVertically: true,
      multiLine: true,
      resizable: true
    }
  }).optional(),
});

export const UpdateCaseInputSchema = z.object({
  Id: z.string().describe("The ID of the case"),
  ...CreateCaseInputSchema.partial().shape,
});

export const SearchCasesInputSchema = z.object({
  Id: z.string().optional().describe("The ID of the case"),
  Subject: z.string().optional().describe("The subject of the case"),
  Description: z.string().optional().describe("The description of the case"),
  Status: z.string().optional().describe("The status of the case"),
});
