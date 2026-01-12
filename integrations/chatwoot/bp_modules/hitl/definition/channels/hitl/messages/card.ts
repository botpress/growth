/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

import { z } from "@botpress/sdk";
export const card = {
  schema: z
    .object({
      title: z.string().min(1, undefined),
      subtitle: z.optional(z.string().min(1, undefined)),
      imageUrl: z.optional(z.string().min(1, undefined)),
      actions: z.array(
        z
          .object({
            action: z.enum(["postback", "url", "say"]),
            label: z.string().min(1, undefined),
            value: z.string().min(1, undefined),
          })
          .catchall(z.never()),
      ),
      userId: z.optional(z.string()),
      metadata: z.optional(z.record(z.string(), z.any())),
    })
    .catchall(z.never()),
};
