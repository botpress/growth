import { z } from "@botpress/sdk";
import { getSearchOutputSchema } from "../utils/schemaUtils";

export const CreateLeadInputSchema = z.object({
  FirstName: z.string().describe("The first name of the lead (e.g. John)"),
  LastName: z.string().describe("The last name of the lead (e.g. Doe)"),
  Company: z.string().describe("The company of the lead (e.g. Acme Inc.)"),
  Email: z
    .string()
    .email()
    .describe("The email address of the lead (e.g. john.doe@example.com)"),
  Phone: z
    .string()
    .optional()
    .describe("The phone number of the lead (Optional) (e.g. +1-555-1234)"),
  Title: z
    .string()
    .optional()
    .describe(
      "The title of the lead (Optional) (e.g. Assistant to the Regional Manager)"
    ),
});

export const UpdateLeadInputSchema = z.object({
  Id: z.string().describe("The ID of the lead"),
  ...CreateLeadInputSchema.partial().shape,
});

export const SearchLeadsInputSchema = z.object({
  id: z.string().optional().describe("The ID of the lead (e.g., leadId1)"),
  name: z.string().optional().describe("The name of the lead (e.g., John Doe)"),
  email: z
    .string()
    .email()
    .optional()
    .describe("The email address of the lead (e.g., john.doe@example.com)"),
});

export const SearchLeadsOutputSchema = getSearchOutputSchema(
  z.object({
    Id: z.string().describe("The ID of the lead"),
    FirstName: z
      .string()
      .nullable()
      .describe("The first name of the lead (e.g. John)"),
    LastName: z
      .string()
      .nullable()
      .describe("The last name of the lead (e.g. Doe)"),
    Company: z
      .string()
      .nullable()
      .describe("The company of the lead (e.g. Acme Inc.)"),
    Email: z
      .string()
      .nullable()
      .describe("The email address of the lead (e.g. john.doe@example.com)"),
    Phone: z
      .string()
      .nullable()
      .describe("The phone number of the lead (Optional) (e.g. +1-555-1234)"),
    Title: z
      .string()
      .nullable()
      .describe(
        "The title of the lead (Optional) (e.g. Assistant to the Regional Manager)"
      ),
  })
);

export const DeleteLeadInputSchema = z.object({
  id: z.string().describe("ID of the lead to be removed"),
});
