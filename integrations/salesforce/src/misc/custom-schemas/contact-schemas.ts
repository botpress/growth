import { z } from "@botpress/sdk";

export const CreateContactInputSchema = z.object({
  FirstName: z.string().describe("The first name of the contact (e.g. John)"),
  LastName: z.string().describe("The last name of the contact (e.g. Doe)"),
  Email: z
    .string()
    .email()
    .describe("The email address of the contact (e.g. john.doe@example.com)"),
  Phone: z
    .string()
    .optional()
    .describe("The phone number of the contact (Optional) (e.g. +1-555-1234)"),
  customFields: z.string().displayAs<any>({
    id: 'text',
    params: {
      allowDynamicVariable: true,
      growVertically: true,
      multiLine: true,
      resizable: true
    }
  }).optional().describe("Custom fields (JSON)"),
});

export const UpdateContactInputSchema = z.object({
  Id: z.string().describe("The ID of the contact"),
  ...CreateContactInputSchema.partial().shape,
});

export const SearchContactsInputSchema = z.object({
  Id: z.string().optional().describe("The ID of the contact"),
  Name: z
    .string()
    .optional()
    .describe("The first name of the contact (e.g. John)"),
  Email: z
    .string()
    .email()
    .optional()
    .describe("The email address of the contact (e.g. john.doe@example.com)"),
});
