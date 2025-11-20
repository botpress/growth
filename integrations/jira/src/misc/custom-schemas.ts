import { z } from '@botpress/sdk'
import {
  AvatarUrlsSchema,
  SimpleListWrapperApplicationRoleSchema,
  SimpleListWrapperGroupNameSchema,
} from './sub-schemas'

export const newIssueInputSchema = z.object({
  // All Jira instances require a summary, issue type, project key.
  summary: z
    .string()
    .title('Summary')
    .describe('The summary of the issue, providing a brief description (e.g. My Issue)'),
  issueType: z
    .string()
    .title('Issue Type')
    .describe('The type of the issue (e.g. "Bug", "Task", "Subtask", "Story" or "Epic")'),
  projectKey: z.string().title('Project Key').describe('The key of the project to which the issue belongs (e.g. TEST)'),
  description: z
    .string()
    .optional()
    .title('Description')
    .describe(
      'The detailed description of the issue (Optional) (e.g. This is an example issue for demonstration purposes)'
    ),
  parentKey: z
    .string()
    .optional()
    .title('Parent Key')
    .describe('The key of the parent issue, if this issue is a sub-task (Optional) (e.g. TEST-1)'),
  assigneeId: z
    .string()
    .optional()
    .title('Assignee ID')
    .describe('The ID of the user to whom the issue is assigned (Optional) (e.g. 5b10ac8d82e05b22cc7d4ef5)'),
})

export const newIssueOutputSchema = z.object({
  issueKey: z.string().title('Issue Key').describe('The key of the created issue'),
})

export const findUserInputSchema = z.object({
  accountId: z
    .string()
    .title('Account ID')
    .describe('Account ID (e.g. 5b10a2844c20165700ede21g or 747474:a1b2c3d4-e5f6-7890-a1b2-c3d4e5f67890)'),
})

export const findUserOutputSchema = z.object({
  self: z.string().optional().title('Self').describe('The URL of the user'),
  key: z.string().optional().title('Key').describe('The key of the user'),
  accountId: z.string().title('Account ID').describe('The account ID of the user'),
  accountType: z.string().optional().title('Account Type').describe('The type of the account'),
  name: z.string().optional().title('Name').describe('The name of the user'),
  emailAddress: z.string().optional().title('Email Address').describe('The email address of the user'),
  avatarUrls: AvatarUrlsSchema.optional().title('Avatar URLs').describe('The avatar URLs of the user'),
  displayName: z.string().optional().title('Display Name').describe('The display name of the user'),
  active: z.boolean().title('Active').describe('Whether the user is active'),
  timeZone: z.string().optional().title('Time Zone').describe('The time zone of the user'),
  locale: z.string().optional().title('Locale').describe('The locale of the user'),
  groups: SimpleListWrapperGroupNameSchema.optional().title('Groups').describe('The groups the user belongs to'),
  applicationRoles: SimpleListWrapperApplicationRoleSchema.optional()
    .title('Application Roles')
    .describe('The application roles of the user'),
  expand: z.string().optional().title('Expand').describe('The expand parameter'),
})

export const updateIssueInputSchema = newIssueInputSchema.partial().extend({
  // All Jira instances for updating an issue require an issue key.
  issueKey: z.string().title('Issue Key').describe('The Key for Issue (e.g. TASK-185)'),
  issueType: z
    .string()
    .optional()
    .title('Issue Type')
    .describe('The type of the issue (e.g. "Bug", "Task", "Subtask", "Story" or "Epic")'),
})

export const updateIssueOutputSchema = newIssueOutputSchema

export const addCommentToIssueInputSchema = z.object({
  issueKey: z.string().title('Issue Key').describe('The Key for Issue (e.g. TASK-185)'),
  body: z.string().title('Body').describe('Message content in text format'),
})

export const addCommentToIssueOutputSchema = z.object({
  id: z.string().optional().title('ID').describe('The ID of the created comment'),
})

export const findAllUsersInputSchema = z.object({
  startAt: z
    .number()
    .optional()
    .title('Start At')
    .describe('The index of the first item to return (Default: 0) (Optional)'),
  maxResults: z
    .number()
    .optional()
    .title('Max Results')
    .describe('The maximum number of items to return (Default: 50) (Optional)'),
})

export const findAllUsersOutputSchema = z.object({
  users: z.array(findUserOutputSchema).title('Users').describe('The list of users'),
})
