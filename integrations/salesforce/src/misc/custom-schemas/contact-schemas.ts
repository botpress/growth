import { z } from "@botpress/sdk";

export const ErrorSchema = z.object({
  statusCode: z.string(),
  message: z.string(),
  fields: z.array(z.string()),
});

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
  AccountId: z
    .string()
    .optional()
    .describe("The ID of the account associated with the contact (Optional)"),
  Title: z
    .string()
    .optional()
    .describe(
      "The title of the contact (Optional) (e.g. Assistant to the Regional Manager)"
    ),
});

export const CreateContactOutputSchema = z.object({
  id: z.string().optional(),
  success: z.boolean(),
  errors: z.array(ErrorSchema).optional(),
});

export const UpdateContactInputSchema = z.object({
  Id: z.string().describe("The ID of the contact to update"),
  FirstName: z
    .string()
    .optional()
    .describe("The updated first name of the contact (Optional) (e.g. John)"),
  LastName: z
    .string()
    .optional()
    .describe("The updated last name of the contact (Optional) (e.g. Doe)"),
  AccountId: z
    .string()
    .optional()
    .describe(
      "The updated ID of the account associated with the contact (Optional)"
    ),
  Email: z
    .string()
    .optional()
    .describe(
      "The updated email address of the contact (Optional) (e.g. john.doe@example.com)"
    ),
  Phone: z
    .string()
    .optional()
    .describe(
      "The updated phone number of the contact (Optional) (e.g. +1-555-1234)"
    ),
});

export const UpdateContactOutputSchema = CreateContactOutputSchema;

export const DeleteContactInputSchema = z.object({
  ids: z
    .string()
    .describe(
      "IDs of the contacts to be removed, separated by commas (e.g., contactId1, contactId2, contactId3)"
    ),
});

export const DeleteContactOutputSchema = z.object({
  results: z.array(CreateContactOutputSchema),
});

export const SearchContactsInputSchema = z.object({
  id: z.string().optional().describe("The ID of the contact (e.g. John)"),
  name: z
    .string()
    .optional()
    .describe("The first name of the contact (e.g. John)"),
  email: z
    .string()
    .email()
    .optional()
    .describe("The email address of the contact (e.g. john.doe@example.com)"),
});

export const SearchContactsOutputSchema = z.object({
  records: z.array(
    z.object({
      Id: z.string().describe("Id of the contact"),
      Name: z.string().describe("The full name of the contact"),
      FirstName: z.string().describe("The first name of the contact"),
      LastName: z.string().describe("The last name of the contact"),
      Email: z.string().email().describe("The email address of the contact"),
      Phone: z.string().nullable().describe("The phone number of the contact"),
      Title: z.string().nullable().describe("The title of the contact"),
      AccountId: z.string().nullable().describe("The title of the contact"),
    })
  ),
});
