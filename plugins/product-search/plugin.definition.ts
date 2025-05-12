import { PluginDefinition } from "@botpress/sdk";
import * as sdk from "@botpress/sdk";

export default new PluginDefinition({
  name: "plus/product-search",
  version: "1.0.0",
  configuration: {
    schema: sdk.z.object({
      tableName: sdk.z
        .string()
        .title("Table Name")
        .describe("The name of the table to store the product data.")
        .min(1, { message: "Table name is required" })
        .regex(/^[^\d]/, {
          message: "Table name must not start with a number",
        }),

      // tableColumns: sdk.z
      //   .array(sdk.z.string())
      //   .title("Table Columns")
      //   .describe(
      //     "The columns of the table to search from and return as results.",
      //   ),
    }),
  },
  actions: {
    searchProducts: {
      // the user can choose where the user message came from (we won't pull directly from event.preview)
      input: {
        schema: sdk.z.object({
          message: sdk.z
            .string()
            .describe("The user message to search for products."),
          limit: sdk.z
            .number()
            .describe("The maximum number of results to return."),
          offset: sdk.z.number().describe("The number of results to skip."),
        }),
      },
      output: {
        schema: sdk.z.object({
          // void because we will send a message to the user with the results
        }),
      },
    },
  },
});
