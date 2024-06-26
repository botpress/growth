import { z } from "@botpress/sdk";
import { ErrorSchema } from "./contact-schemas";

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

export const CreateLeadOutputSchema = z.object({
  id: z.string().optional(),
  success: z.boolean(),
  errors: z.array(ErrorSchema).optional(),
});

export const UpdateLeadInputSchema = z.object({
  Id: z.string().describe("The ID of the lead to update"),
  FirstName: z
    .string()
    .optional()
    .describe("The updated first name of the lead (Optional) (e.g. John)"),
  LastName: z
    .string()
    .optional()
    .describe("The updated last name of the lead (Optional) (e.g. Doe)"),
  Company: z
    .string()
    .optional()
    .describe("The updated company of the lead (Optional) (e.g. Acme Inc.)"),
  Email: z
    .string()
    .optional()
    .describe(
      "The updated email address of the lead (Optional) (e.g. john.doe@example.com)"
    ),
  Phone: z
    .string()
    .optional()
    .describe(
      "The updated phone number of the lead (Optional) (e.g. +1-555-1234)"
    ),
  Title: z
    .string()
    .optional()
    .describe(
      "The updated title of the lead (Optional) (e.g. Assistant to the Regional Manager)"
    ),
});

export const UpdateLeadOutputSchema = z.object({
  id: z.string().optional(),
  success: z.boolean(),
  errors: z.array(ErrorSchema).optional(),
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

export const SearchLeadsOutputSchema = z.object({
  records: z.array(
    z.object({
      Id: z.string().describe("Id of the lead"),
      Name: z.string().describe("The full name of the lead"),
      FirstName: z.string().describe("The first name of the lead"),
      LastName: z.string().describe("The last name of the lead"),
      Company: z.string().describe("The company of the lead"),
      Email: z.string().email().describe("The email address of the lead"),
      Phone: z.string().nullable().describe("The phone number of the lead"),
      Title: z.string().nullable().describe("The title of the lead"),
    })
  ),
});

export const DeleteLeadsInputSchema = z.object({
  ids: z
    .string()
    .describe(
      "IDs of the contacts to be removed, separated by commas (e.g., lead1, lead2, lead3)"
    ),
});

export const DeleteLeadsOutputSchema = z.object({
  results: z.array(CreateLeadOutputSchema),
});
