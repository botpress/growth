import { z } from "@botpress/sdk";
import { ErrorSchema } from "./contact-schemas";

export const CreateCaseInputSchema = z.object({
  Subject: z.string().describe("The subject of the case"),
  SuppliedName: z.string().describe("The supplied name for the case"),
  Description: z.string().optional().describe("The description of the case"),
  Priority: z.string().optional().describe("The priority of the case"),
});

export const CreateCaseOutputSchema = z.object({
  id: z.string().optional(),
  success: z.boolean(),
  errors: z.array(ErrorSchema).optional(),
});

export const UpdateCaseInputSchema = z.object({
  Id: z.string().describe("The ID of the case to update"),
  Subject: z.string().optional().describe("The subject of the case"),
  SuppliedName: z
    .string()
    .optional()
    .describe("The supplied name for the case"),
  Description: z.string().optional().describe("The description of the case"),
  Priority: z.string().optional().describe("The priority of the case"),
});

export const UpdateCaseOutputSchema = CreateCaseOutputSchema;

export const DeleteCaseInputSchema = z.object({
  caseId: z.string().describe("ID of the case to be removed"),
});

export const DeleteCaseOutputSchema = CreateCaseOutputSchema;

export const SearchCasesInputSchema = z.object({
  Id: z.string().optional().describe("The ID of the case to update"),
  Subject: z.string().optional().describe("The subject of the case"),
  SuppliedName: z
    .string()
    .optional()
    .describe("The supplied name for the case"),
  Description: z.string().optional().describe("The description of the case"),
  Priority: z.string().optional().describe("The priority of the case"),
});

export const SearchCasesOutputSchema = z.object({
  records: z.array(
    z.object({
      Id: z.string().describe("The ID of the case to update"),
      Subject: z.string().describe("The subject of the case"),
      SuppliedName: z.string().describe("The supplied name for the case"),
      Description: z
        .string()
        .optional()
        .describe("The description of the case"),
      Priority: z.string().optional().describe("The priority of the case"),
    })
  ),
});
