/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

import { z } from '@botpress/sdk'
export const hitlAssigned = {
  attributes: { bpActionHiddenInStudio: 'true' },
  schema: z
    .object({
      conversationId: z
        .string()
        .title('HITL session ID')
        .describe('ID of the Botpress conversation representing the HITL session'),
      userId: z
        .string()
        .title('Human agent user ID')
        .describe('ID of the Botpress user representing the human agent assigned to the HITL session'),
    })
    .catchall(z.never()),
}
