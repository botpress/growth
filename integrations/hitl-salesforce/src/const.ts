export const INTEGRATION_NAME = 'hitl-salesforce'

export const ROUTING_STATUS = {
  NEEDS_ROUTING: 'NEEDS_ROUTING', // Agent ended the chat - should close conversation
  TRANSFER: 'TRANSFER', // Agent transferred - should send transfer message
} as const
