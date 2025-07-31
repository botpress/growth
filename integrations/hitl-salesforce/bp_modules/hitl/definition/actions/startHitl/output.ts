/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

import { z } from '@botpress/sdk'
export const output = {
  schema: z
    .object({
      conversationId: z
        .string()
        .title('HITL session ID')
        .describe('ID of the Botpress conversation representing the HITL session'),
    })
    .catchall(z.never()),
}
