import { z, IntegrationDefinitionProps } from '@botpress/sdk'

export const actions = {
  sendMail: {
    title: 'Send Email',
    description: 'Send an email via AWS SES',
    input: {
      schema: z.object({
        to: z.array(z.string().email()).describe('Recipient email addresses').min(1),
        subject: z.string().describe('Email subject'),
        body: z.string().optional().describe('Email content - supports only plain text'),
      }),
    },
    output: {
      schema: z.object({
        success: z.boolean().describe('Whether the email was sent successfully'),
        messageIds: z.array(z.string()).describe('AWS SES Message IDs for successful sends'),
        message: z.string().describe('Status message'),
        details: z.object({
          successful: z.array(z.object({
            email: z.string().email(),
            messageId: z.string(),
          })),
          failed: z.array(z.object({
            email: z.string().email(),
            error: z.string(),
            reason: z.string(),
          })),
          totalSent: z.number(),
          totalFailed: z.number(),
        }).optional(),
      }),
    },
  },
} satisfies IntegrationDefinitionProps['actions']

export const states = {} satisfies IntegrationDefinitionProps["states"];

export const events = {
  emailSent: {
    title: "Email Sent",
    description: "Triggered when an email is successfully sent via AWS SES",
    schema: z.object({
      messageId: z.string().describe("AWS SES Message ID"),
      to: z.array(z.string().email()).describe("Recipient email addresses"),
      subject: z.string().describe("Email subject"),
      fromEmail: z.string().email().describe("Sender email address"),
      timestamp: z.string().describe("ISO timestamp when email was sent"),
    }),
  },
} satisfies IntegrationDefinitionProps["events"];
