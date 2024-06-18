import { z } from "@botpress/sdk";
import { getSearchOutputSchema } from "../utils/schemaUtils";

export const CreateCaseInputSchema = z.object({
  Subject: z.string().describe("The subject of the case"),
  SuppliedName: z.string().describe("The supplied name for the case"),
  Description: z.string().optional().describe("The description of the case"),
  Priority: z.string().optional().describe("The priority of the case"),
});

export const UpdateCaseInputSchema = z.object({
  Id: z.string().describe("The ID of the case"),
  ...CreateCaseInputSchema.partial().shape,
});

export const DeleteCaseInputSchema = z.object({
  id: z.string().describe("ID of the case to be removed"),
});

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

export const SearchCasesOutputSchema = getSearchOutputSchema(
  z.object({
    Id: z.string().describe("The ID of the case"),
    Subject: z.string().nullable().describe("The subject of the case"),
    SuppliedName: z
      .string()
      .nullable()
      .describe("The supplied name for the case"),
    Description: z.string().nullable().describe("The description of the case"),
    Priority: z.string().nullable().describe("The priority of the case"),
  })
);
