import { z, IntegrationDefinition, interfaces } from "@botpress/sdk";

export default new IntegrationDefinition({
  name: "huggingface",
  title: "Hugging Face",
  version: "0.0.1",
  readme: "hub.md",
  icon: "icon.svg",
  configuration: {
    schema: z.object({
      accessToken: z.string(),
      languageModels: z.string().optional().describe("LLMs to use"),
    }),
  },
  entities: {
    modelRef: {
      schema: z.object({
        id: z.string().describe("Model to use for content generation"),
      }),
    },
  },
  states: {
    availableModels: {
      type: "integration",
      schema: z.object({
        languageModels: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            description: z.string(),
            tags: z.array(
              z.enum([
                "recommended",
                "deprecated",
                "general-purpose",
                "low-cost",
                "vision",
                "coding",
                "agents",
                "function-calling",
                "roleplay",
                "storytelling",
              ])
            ),
            input: z.object({
              maxTokens: z.number().int(),
              costPer1MTokens: z
                .number()
                .describe("Cost per 1 million tokens, in U.S. dollars"),
            }),
            output: z.object({
              maxTokens: z.number().int(),
              costPer1MTokens: z
                .number()
                .describe("Cost per 1 million tokens, in U.S. dollars"),
            }),
          })
        ),
      }),
    },
  },
}).extend(interfaces.llm, ({ modelRef }) => ({
  modelRef,
}));
