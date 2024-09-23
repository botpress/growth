import { z } from "@botpress/sdk";

export const CreateLeadInputSchema = z.object({
  FirstName: z.string().describe("The first name of the lead (e.g. John)"),
  LastName: z.string().describe("The last name of the lead (e.g. Doe)"),
  Email: z.string().email().describe("The email address of the lead"),
  Company: z.string().describe("The company of the lead (e.g. Acme Inc.)"),
  Phone: z.string().optional().describe("The phone number of the lead"),
  Title: z.string().optional().describe("The title of the lead"),
  Description: z.string().optional().describe("The title of the lead"),
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

export const UpdateLeadInputSchema = z.object({
  Id: z.string().describe("The ID of the lead"),
  ...CreateLeadInputSchema.partial().shape,
});

export const SearchLeadsInputSchema = z.object({
  Id: z.string().optional().describe("The ID of the lead (e.g., leadId1)"),
  Name: z.string().optional().describe("The name of the lead (e.g., John Doe)"),
  Email: z
    .string()
    .email()
    .optional()
    .describe("The email address of the lead (e.g., john.doe@example.com)"),
});
