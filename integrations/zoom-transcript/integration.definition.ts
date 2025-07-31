import { z, IntegrationDefinition } from "@botpress/sdk";

export default new IntegrationDefinition({
  name: "plus/zoom-transcript",
  version: "1.0.8",
  title: "Zoom Transcript",
  description: "Receives Zoom webhook and processes transcript for meetings.",
  icon: "icon.svg",
  readme: "hub.md",
  configuration: {
    schema: z.object({
      zoomAccountId: z
        .string()
        .describe(
          "Zoom Account ID (Found on Zoom OAuth App under App Credentials)",
        ),
      zoomClientId: z
        .string()
        .describe(
          "Zoom Client ID (Found on Zoom OAuth App under App Credentials)",
        ),
      zoomClientSecret: z
        .string()
        .describe(
          "Zoom Client Secret (Found on Zoom OAuth App under App Credentials)",
        ),
      secretToken: z
        .string()
        .describe("Secret Token (Found on Zoom OAuth App under Features)"),
      allowedZoomUserIds: z
        .array(z.string())
        .describe("Process events from these Zoom User IDs"),
    }),
  },

  events: {
    transcriptReceived: {
      schema: z.object({
        meetingUUID: z.string(),
        transcript: z.string(),
        rawVtt: z.string().optional(),
      }),
    },
  },
});
