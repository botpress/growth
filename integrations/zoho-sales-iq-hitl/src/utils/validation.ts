import { RuntimeError } from '@botpress/client'

export const validateConversationTag = (tagValue: string | number | undefined): string => {
  if (tagValue === undefined || tagValue === null) {
    throw new RuntimeError('Invalid conversation tag: entity_id is required')
  }
  const stringValue = String(tagValue).trim()
  if (stringValue === '') {
    throw new RuntimeError('Invalid conversation tag: entity_id cannot be empty')
  }
  return stringValue
}

export const validateUserTag = (emailId: string | undefined): string => {
  if (emailId === undefined || emailId === null) {
    throw new RuntimeError('Invalid user tag: email_id is required')
  }
  const stringValue = String(emailId).trim()
  if (stringValue === '') {
    throw new RuntimeError('Invalid user tag: email_id is required and cannot be empty')
  }
  return emailId
}
