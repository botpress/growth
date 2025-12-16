/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

import { z } from "@botpress/sdk";
export const markdown = {
  schema: z
    .object({
      markdown: z.string().min(1, undefined),
      userId: z.optional(z.string()),
      metadata: z.optional(z.record(z.string(), z.any())),
    })
    .catchall(z.never()),
};
