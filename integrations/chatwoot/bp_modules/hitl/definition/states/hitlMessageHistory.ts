/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

import { z } from "@botpress/sdk";
export const hitlMessageHistory = {
  type: "conversation" as const,
  schema: z
    .object({
      value: z
        .array(
          z.union([
            z
              .object({
                source: z.union([
                  z
                    .object({
                      type: z.literal("user"),
                      userId: z.string(),
                    })
                    .catchall(z.never()),
                  z
                    .object({
                      type: z.literal("bot"),
                    })
                    .catchall(z.never()),
                ]),
                type: z.literal("text"),
                payload: z
                  .object({
                    text: z.string().min(1, undefined),
                  })
                  .catchall(z.never()),
              })
              .catchall(z.never()),
            z
              .object({
                source: z.union([
                  z
                    .object({
                      type: z.literal("user"),
                      userId: z.string(),
                    })
                    .catchall(z.never()),
                  z
                    .object({
                      type: z.literal("bot"),
                    })
                    .catchall(z.never()),
                ]),
                type: z.literal("image"),
                payload: z
                  .object({
                    imageUrl: z.string().min(1, undefined),
                  })
                  .catchall(z.never()),
              })
              .catchall(z.never()),
            z
              .object({
                source: z.union([
                  z
                    .object({
                      type: z.literal("user"),
                      userId: z.string(),
                    })
                    .catchall(z.never()),
                  z
                    .object({
                      type: z.literal("bot"),
                    })
                    .catchall(z.never()),
                ]),
                type: z.literal("audio"),
                payload: z
                  .object({
                    audioUrl: z.string().min(1, undefined),
                  })
                  .catchall(z.never()),
              })
              .catchall(z.never()),
            z
              .object({
                source: z.union([
                  z
                    .object({
                      type: z.literal("user"),
                      userId: z.string(),
                    })
                    .catchall(z.never()),
                  z
                    .object({
                      type: z.literal("bot"),
                    })
                    .catchall(z.never()),
                ]),
                type: z.literal("video"),
                payload: z
                  .object({
                    videoUrl: z.string().min(1, undefined),
                  })
                  .catchall(z.never()),
              })
              .catchall(z.never()),
            z
              .object({
                source: z.union([
                  z
                    .object({
                      type: z.literal("user"),
                      userId: z.string(),
                    })
                    .catchall(z.never()),
                  z
                    .object({
                      type: z.literal("bot"),
                    })
                    .catchall(z.never()),
                ]),
                type: z.literal("file"),
                payload: z
                  .object({
                    fileUrl: z.string().min(1, undefined),
                    title: z.optional(z.string().min(1, undefined)),
                  })
                  .catchall(z.never()),
              })
              .catchall(z.never()),
            z
              .object({
                source: z.union([
                  z
                    .object({
                      type: z.literal("user"),
                      userId: z.string(),
                    })
                    .catchall(z.never()),
                  z
                    .object({
                      type: z.literal("bot"),
                    })
                    .catchall(z.never()),
                ]),
                type: z.literal("location"),
                payload: z
                  .object({
                    latitude: z.number(),
                    longitude: z.number(),
                    address: z.optional(z.string()),
                    title: z.optional(z.string()),
                  })
                  .catchall(z.never()),
              })
              .catchall(z.never()),
            z
              .object({
                source: z.union([
                  z
                    .object({
                      type: z.literal("user"),
                      userId: z.string(),
                    })
                    .catchall(z.never()),
                  z
                    .object({
                      type: z.literal("bot"),
                    })
                    .catchall(z.never()),
                ]),
                type: z.literal("carousel"),
                payload: z
                  .object({
                    items: z.array(
                      z
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
                        })
                        .catchall(z.never()),
                    ),
                  })
                  .catchall(z.never()),
              })
              .catchall(z.never()),
            z
              .object({
                source: z.union([
                  z
                    .object({
                      type: z.literal("user"),
                      userId: z.string(),
                    })
                    .catchall(z.never()),
                  z
                    .object({
                      type: z.literal("bot"),
                    })
                    .catchall(z.never()),
                ]),
                type: z.literal("card"),
                payload: z
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
                  })
                  .catchall(z.never()),
              })
              .catchall(z.never()),
            z
              .object({
                source: z.union([
                  z
                    .object({
                      type: z.literal("user"),
                      userId: z.string(),
                    })
                    .catchall(z.never()),
                  z
                    .object({
                      type: z.literal("bot"),
                    })
                    .catchall(z.never()),
                ]),
                type: z.literal("dropdown"),
                payload: z
                  .object({
                    text: z.string().min(1, undefined),
                    options: z.array(
                      z
                        .object({
                          label: z.string().min(1, undefined),
                          value: z.string().min(1, undefined),
                        })
                        .catchall(z.never()),
                    ),
                  })
                  .catchall(z.never()),
              })
              .catchall(z.never()),
            z
              .object({
                source: z.union([
                  z
                    .object({
                      type: z.literal("user"),
                      userId: z.string(),
                    })
                    .catchall(z.never()),
                  z
                    .object({
                      type: z.literal("bot"),
                    })
                    .catchall(z.never()),
                ]),
                type: z.literal("choice"),
                payload: z
                  .object({
                    text: z.string().min(1, undefined),
                    options: z.array(
                      z
                        .object({
                          label: z.string().min(1, undefined),
                          value: z.string().min(1, undefined),
                        })
                        .catchall(z.never()),
                    ),
                  })
                  .catchall(z.never()),
              })
              .catchall(z.never()),
            z
              .object({
                source: z.union([
                  z
                    .object({
                      type: z.literal("user"),
                      userId: z.string(),
                    })
                    .catchall(z.never()),
                  z
                    .object({
                      type: z.literal("bot"),
                    })
                    .catchall(z.never()),
                ]),
                type: z.literal("bloc"),
                payload: z
                  .object({
                    items: z.array(
                      z.union([
                        z
                          .object({
                            type: z.literal("text"),
                            payload: z
                              .object({
                                text: z.string().min(1, undefined),
                              })
                              .catchall(z.never()),
                          })
                          .catchall(z.never()),
                        z
                          .object({
                            type: z.literal("markdown"),
                            payload: z
                              .object({
                                markdown: z.string().min(1, undefined),
                              })
                              .catchall(z.never()),
                          })
                          .catchall(z.never()),
                        z
                          .object({
                            type: z.literal("image"),
                            payload: z
                              .object({
                                imageUrl: z.string().min(1, undefined),
                              })
                              .catchall(z.never()),
                          })
                          .catchall(z.never()),
                        z
                          .object({
                            type: z.literal("audio"),
                            payload: z
                              .object({
                                audioUrl: z.string().min(1, undefined),
                              })
                              .catchall(z.never()),
                          })
                          .catchall(z.never()),
                        z
                          .object({
                            type: z.literal("video"),
                            payload: z
                              .object({
                                videoUrl: z.string().min(1, undefined),
                              })
                              .catchall(z.never()),
                          })
                          .catchall(z.never()),
                        z
                          .object({
                            type: z.literal("file"),
                            payload: z
                              .object({
                                fileUrl: z.string().min(1, undefined),
                                title: z.optional(z.string().min(1, undefined)),
                              })
                              .catchall(z.never()),
                          })
                          .catchall(z.never()),
                        z
                          .object({
                            type: z.literal("location"),
                            payload: z
                              .object({
                                latitude: z.number(),
                                longitude: z.number(),
                                address: z.optional(z.string()),
                                title: z.optional(z.string()),
                              })
                              .catchall(z.never()),
                          })
                          .catchall(z.never()),
                      ]),
                    ),
                  })
                  .catchall(z.never()),
              })
              .catchall(z.never()),
            z
              .object({
                source: z.union([
                  z
                    .object({
                      type: z.literal("user"),
                      userId: z.string(),
                    })
                    .catchall(z.never()),
                  z
                    .object({
                      type: z.literal("bot"),
                    })
                    .catchall(z.never()),
                ]),
                type: z.literal("markdown"),
                payload: z
                  .object({
                    markdown: z.string().min(1, undefined),
                  })
                  .catchall(z.never()),
              })
              .catchall(z.never()),
          ]),
        )
        .title("Conversation history")
        .describe(
          "History of all messages in the conversation up to this point. Should be displayed to the human agent in the external service.",
        ),
    })
    .catchall(z.never()),
};
