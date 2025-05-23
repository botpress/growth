/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

import { z } from "@botpress/sdk";
export const input = {
  schema: z.object({
    name: /** Display name of the end user */ z.string(),
    pictureUrl: /** URL of the end user's avatar */ z.optional(
      /** URL of the end user's avatar */ z.string(),
    ),
    email: /** Email address of the end user */ z.optional(
      /** Email address of the end user */ z.string(),
    ),
  }),
};
