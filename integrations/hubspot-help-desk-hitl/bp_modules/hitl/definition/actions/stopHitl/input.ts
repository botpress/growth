/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

import { z } from "@botpress/sdk";
export const input = {
  schema: z.object({
    conversationId: z.string(),
    reason: z.optional(z.enum(["timeout", "cancel"])),
  }),
};
