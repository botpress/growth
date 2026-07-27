import { RuntimeError } from '@botpress/client'

const validateTag = (errorPrefix: string, tagValue: string | number | undefined): string => {
  if (tagValue === undefined) {
    throw new RuntimeError(`${errorPrefix}: tagValue is required`)
  }
  const stringValue = String(tagValue).trim()
  if (stringValue === '') {
    throw new RuntimeError(`${errorPrefix}: tagValue cannot be empty`)
  }
  return stringValue
}

export const validateConversationTag = (tagValue: string | number | undefined): string => {
  return validateTag('Invalid conversation tag', tagValue)
}

export const validateUserTag = (tagValue: string | undefined): string => {
  return validateTag('Invalid user tag', tagValue)
}
