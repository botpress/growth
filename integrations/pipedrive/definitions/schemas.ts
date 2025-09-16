import { z } from "@botpress/sdk";

export const addPersonSchema = z.object({
    name: z.string().title('Name').describe('The name of the person'),
    owner_id: z.number().optional().title('Owner ID').describe('The ID of the owner of the person'),
    org_id: z.number().optional().title('Organization ID').describe('The ID of the organization the person belongs to'),
    emailValue: z.string().optional().title('Email').describe('Email address'),
    emailPrimary: z.boolean().optional().title('Email is Primary').describe('Mark the email as primary'),
    phoneValue: z.string().optional().title('Phone Number').describe('Phone number'),
    phonePrimary: z.boolean().optional().title('Phone is Primary').describe('Mark the phone as primary'),
    visible_to: z.number().optional().title('Visible To').describe('The visibility of the person')
})

export const updatePersonSchema = z.object({
    person_id: z.number().title('Person ID').describe('The ID of the person to update'),
    name: z.string().optional().title('Name').describe('The name of the person'),
    emailValue: z.string().optional().title('Email').describe('Email address'),
    emailPrimary: z.boolean().optional().title('Email is Primary').describe('Mark the email as primary'),
    phoneValue: z.string().optional().title('Phone Number').describe('Phone number'),
    phonePrimary: z.boolean().optional().title('Phone is Primary').describe('Mark the phone as primary'),
    org_id: z.number().optional().title('Organization ID').describe('The ID of the organization the person belongs to'),
    owner_id: z.number().optional().title('Owner ID').describe('The ID of the owner of the person'),
    visible_to: z.number().optional().title('Visible To').describe('The visibility of the person')
})

export const findPersonSchema = z.object({
    term: z.string().min(2).title('Search Term').describe('The search term to look for (minimum 2 characters)'),
    fields: z.enum(['custom_fields','email','notes','phone','name']).optional().title('Fields to Search').describe('Which fields to search in (custom_fields, email, notes, phone, name)'),
    organization_id: z.number().optional().title('Organization ID').describe('The ID of the organization to search in'),
    exact_match: z.boolean().optional().title('Exact Match').describe('Whether to search for exact matches only'),
})

export const outputPersonSchema = z.object({
    id: z.number().optional(),
    name: z.string().optional(),
    emails: z.array(z.object({
      value: z.string().optional(),
      primary: z.boolean().optional(),
      label: z.string().optional()
    })).optional(),
    phones: z.array(z.object({
      value: z.string().optional(),
      primary: z.boolean().optional(),
      label: z.string().optional()
    })).optional(),
    org_id: z.number().optional(),
    owner_id: z.number().optional(),
    visible_to: z.number().optional(),
    add_time: z.string().nullable().optional(),
    update_time: z.string().nullable().optional()
  }).passthrough().transform(data => data)