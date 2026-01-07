/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

import { z } from "@botpress/sdk";
export const bloc = {
  schema: z.object({
    items: z.array(
      z.union([
        z.object({
          type: z.literal("text"),
          payload: z.object({
            text: z.string(),
          }),
        }),
        z.object({
          type: z.literal("markdown"),
          payload: z.object({
            markdown: z.string(),
          }),
        }),
        z.object({
          type: z.literal("image"),
          payload: z.object({
            imageUrl: z.string(),
          }),
        }),
        z.object({
          type: z.literal("audio"),
          payload: z.object({
            audioUrl: z.string(),
          }),
        }),
        z.object({
          type: z.literal("video"),
          payload: z.object({
            videoUrl: z.string(),
          }),
        }),
        z.object({
          type: z.literal("file"),
          payload: z.object({
            fileUrl: z.string(),
            title: z.optional(z.string()),
          }),
        }),
        z.object({
          type: z.literal("location"),
          payload: z.object({
            latitude: z.number(),
            longitude: z.number(),
            address: z.optional(z.string()),
            title: z.optional(z.string()),
          }),
        }),
      ]),
    ),
    userId:
      /** Allows sending a message pretending to be a certain user */ z.optional(
        /** Allows sending a message pretending to be a certain user */ z.string(),
      ),
  }),
};
