import { RuntimeError } from '@botpress/client'
import * as bp from '.botpress'
import { extractError } from 'misc/utils/errorUtils'

export const getRequestPayload = <T extends { email: string; customFields?: string }>(
  input: T,
  logger: bp.Logger
): Record<string, any> => {
  const { email, customFields, ...rest } = input

  let parsedCustomFields = {}
  try {
    parsedCustomFields = customFields ? JSON.parse(customFields) : {}
  } catch (error) {
    throw new RuntimeError(extractError(error, logger))
  }
  return {
    email,
    fields: {
      ...rest,
      ...parsedCustomFields,
    },
  }
}
