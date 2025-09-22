import * as bp from ".botpress";
import { StockItemSchema } from "../misc/zod-schemas";
import { createMagentoClient } from "../services/magento-client";

export const getStockItem: bp.IntegrationProps["actions"]["getStockItem"] =
  async ({ ctx, input, logger }) => {
    try {
      // Create Magento client and get stock item
      const client = createMagentoClient(ctx.configuration, logger);
      const stockData = await client.getStockItem(input.sku);

      // Validate response
      const validatedData = StockItemSchema.parse(stockData);
      return {
        qty: validatedData.qty,
        is_in_stock: validatedData.is_in_stock,
      };
    } catch (error) {
      logger.forBot().error("Error fetching stock item", { error });

      if (
        error instanceof Error &&
        error.message.includes("Validation failed")
      ) {
        return {
          error: "Invalid stock item response",
          details: error.message,
        };
      }

      return {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  };
