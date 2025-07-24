/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

import { z } from "@botpress/sdk";
export const input = {
  schema: z.object({
    userId: z.string(),
    title: z.string(),
    description: z.optional(z.string()),
    messageHistory:
      /** Message history to display in the HITL session */ z.optional(
        z.array(
          z.union([
            z.object({
              source: z.union([
                z.object({
                  type: z.literal("user"),
                  userId: z.string(),
                }),
                z.object({
                  type: z.literal("bot"),
                }),
              ]),
              type: z.literal("text"),
              payload: z.object({
                text: z.string(),
              }),
            }),
            z.object({
              source: z.union([
                z.object({
                  type: z.literal("user"),
                  userId: z.string(),
                }),
                z.object({
                  type: z.literal("bot"),
                }),
              ]),
              type: z.literal("image"),
              payload: z.object({
                imageUrl: z.string(),
              }),
            }),
            z.object({
              source: z.union([
                z.object({
                  type: z.literal("user"),
                  userId: z.string(),
                }),
                z.object({
                  type: z.literal("bot"),
                }),
              ]),
              type: z.literal("audio"),
              payload: z.object({
                audioUrl: z.string(),
              }),
            }),
            z.object({
              source: z.union([
                z.object({
                  type: z.literal("user"),
                  userId: z.string(),
                }),
                z.object({
                  type: z.literal("bot"),
                }),
              ]),
              type: z.literal("video"),
              payload: z.object({
                videoUrl: z.string(),
              }),
            }),
            z.object({
              source: z.union([
                z.object({
                  type: z.literal("user"),
                  userId: z.string(),
                }),
                z.object({
                  type: z.literal("bot"),
                }),
              ]),
              type: z.literal("file"),
              payload: z.object({
                fileUrl: z.string(),
                title: z.optional(z.string()),
              }),
            }),
            z.object({
              source: z.union([
                z.object({
                  type: z.literal("user"),
                  userId: z.string(),
                }),
                z.object({
                  type: z.literal("bot"),
                }),
              ]),
              type: z.literal("location"),
              payload: z.object({
                latitude: z.number(),
                longitude: z.number(),
                address: z.optional(z.string()),
                title: z.optional(z.string()),
              }),
            }),
            z.object({
              source: z.union([
                z.object({
                  type: z.literal("user"),
                  userId: z.string(),
                }),
                z.object({
                  type: z.literal("bot"),
                }),
              ]),
              type: z.literal("carousel"),
              payload: z.object({
                items: z.array(
                  z.object({
                    title: z.string(),
                    subtitle: z.optional(z.string()),
                    imageUrl: z.optional(z.string()),
                    actions: z.array(
                      z.object({
                        action: z.enum(["postback", "url", "say"]),
                        label: z.string(),
                        value: z.string(),
                      }),
                    ),
                  }),
                ),
              }),
            }),
            z.object({
              source: z.union([
                z.object({
                  type: z.literal("user"),
                  userId: z.string(),
                }),
                z.object({
                  type: z.literal("bot"),
                }),
              ]),
              type: z.literal("card"),
              payload: z.object({
                title: z.string(),
                subtitle: z.optional(z.string()),
                imageUrl: z.optional(z.string()),
                actions: z.array(
                  z.object({
                    action: z.enum(["postback", "url", "say"]),
                    label: z.string(),
                    value: z.string(),
                  }),
                ),
              }),
            }),
            z.object({
              source: z.union([
                z.object({
                  type: z.literal("user"),
                  userId: z.string(),
                }),
                z.object({
                  type: z.literal("bot"),
                }),
              ]),
              type: z.literal("dropdown"),
              payload: z.object({
                text: z.string(),
                options: z.array(
                  z.object({
                    label: z.string(),
                    value: z.string(),
                  }),
                ),
              }),
            }),
            z.object({
              source: z.union([
                z.object({
                  type: z.literal("user"),
                  userId: z.string(),
                }),
                z.object({
                  type: z.literal("bot"),
                }),
              ]),
              type: z.literal("choice"),
              payload: z.object({
                text: z.string(),
                options: z.array(
                  z.object({
                    label: z.string(),
                    value: z.string(),
                  }),
                ),
              }),
            }),
            z.object({
              source: z.union([
                z.object({
                  type: z.literal("user"),
                  userId: z.string(),
                }),
                z.object({
                  type: z.literal("bot"),
                }),
              ]),
              type: z.literal("bloc"),
              payload: z.object({
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
              }),
            }),
            z.object({
              source: z.union([
                z.object({
                  type: z.literal("user"),
                  userId: z.string(),
                }),
                z.object({
                  type: z.literal("bot"),
                }),
              ]),
              type: z.literal("markdown"),
              payload: z.object({
                markdown: z.string(),
              }),
            }),
          ]),
        ),
      ),
  }),
};
