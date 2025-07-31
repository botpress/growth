/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

import { z } from '@botpress/sdk'
export const input = {
  schema: z
    .object({
      name: z.string().title('Display name').describe('Display name of the end user'),
      pictureUrl: z
        .optional(z.string().describe("URL of the end user's avatar"))
        .title('Picture URL')
        .describe("URL of the end user's avatar"),
      email: z
        .optional(z.string().describe('Email address of the end user'))
        .title('Email address')
        .describe('Email address of the end user'),
    })
    .catchall(z.never()),
}
