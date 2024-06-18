import { z } from "@botpress/sdk";

import { getSearchOutputSchema } from "../utils/schemaUtils";

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

export const UpdateContactInputSchema = z.object({
  Id: z.string().describe("The ID of the contact"),
  ...CreateContactInputSchema.partial().shape,
});

export const DeleteContactInputSchema = z.object({
  id: z.string().describe("ID of the contact to be removed."),
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

export const SearchContactsOutputSchema = getSearchOutputSchema(
  z.object({
    Id: z.string().describe("The ID of the contact"),
    FirstName: z
      .string()
      .nullable()
      .describe("The first name of the contact (e.g. John)"),
    LastName: z
      .string()
      .nullable()
      .describe("The last name of the contact (e.g. Doe)"),
    Email: z
      .string()
      .nullable()
      .describe("The email address of the contact (e.g. john.doe@example.com)"),
    Phone: z
      .string()
      .nullable()
      .describe("The phone number of the contact (e.g. +1-555-1234)"),
    AccountId: z
      .string()
      .nullable()
      .describe("The ID of the account associated with the contact"),
    Title: z
      .string()
      .nullable()
      .describe(
        "The title of the contact (e.g. Assistant to the Regional Manager)"
      ),
  })
);
