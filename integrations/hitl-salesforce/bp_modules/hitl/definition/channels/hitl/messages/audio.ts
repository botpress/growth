/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

import { z } from "@botpress/sdk";
export const audio = {
  schema: z
    .object({
      audioUrl: z.string().min(1, undefined),
      userId: z
        .optional(
          z
            .string()
            .describe(
              "Allows sending a message pretending to be a certain user",
            ),
        )
        .describe("Allows sending a message pretending to be a certain user"),
    })
    .catchall(z.never()),
};
