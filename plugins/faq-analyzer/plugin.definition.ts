import { PluginDefinition, z } from "@botpress/sdk";

export default new PluginDefinition({
  name: "plus/faq-analyzer",
  version: "1.6.0",
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      tableName: z
        .string()
        .title("Table Name")
        .describe(
          "The name of the table to store the FAQ data. Do not start your table name with a number.",
        )
        .min(1, { message: "Table name is required" })
        .regex(/^[^\d]/, {
          message: "Table name must not start with a number",
        }),
    }),
  },
  states: {
    table: {
      type: "bot",
      schema: z.object({
        tableCreated: z
          .boolean()
          .describe("Whether the FAQ table has been created"),
      }),
    },
    faqAnalyzed: {
      type: "conversation",
      schema: z.object({
        done: z
          .boolean()
          .describe("Whether the conversation has been analyzed for FAQs"),
      }),
    },
  },
  actions: {},
});
