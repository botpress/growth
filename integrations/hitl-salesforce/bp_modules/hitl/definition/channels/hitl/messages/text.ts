/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

import { z } from "@botpress/sdk";
export const text = {
  schema: z.object({
    text: z.string(),
    userId:
      /** Allows sending a message pretending to be a certain user */ z.optional(
        /** Allows sending a message pretending to be a certain user */ z.string(),
      ),
  }),
};
