/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

import { z } from "@botpress/sdk";
export const hitlAssigned = {
  schema: z.object({
    conversationId:
      /** ID of the Botpress conversation representing the HITL session */ z.string(),
    userId:
      /** ID of the Botpress user representing the human agent assigned to the HITL session */ z.string(),
  }),
};
