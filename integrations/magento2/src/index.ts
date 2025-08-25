import * as sdk from "@botpress/sdk";
import {
  getProducts,
  getStockItem,
  syncProducts,
  executeSyncProducts,
} from "./actions";
import * as bp from ".botpress";
import axios from "axios";
import crypto from "crypto";
import OAuth from "oauth-1.0a";

export default new bp.Integration({
  register: async ({ ctx, logger }) => {
    logger.forBot().info("Registering Magento2 integration");

    try {
      const {
        magento_domain,
        consumer_key,
        consumer_secret,
        access_token,
        access_token_secret,
        user_agent,
        store_code,
      } = ctx.configuration;

      const oauth = new OAuth({
        consumer: {
          key: consumer_key,
          secret: consumer_secret,
        },
        signature_method: "HMAC-SHA256",
        hash_function(baseString: string, key: string) {
          return crypto
            .createHmac("sha256", key)
            .update(baseString)
            .digest("base64");
        },
      });

      const token = {
        key: access_token,
        secret: access_token_secret,
      };

      const testUrl = `https://${magento_domain}/rest/${store_code}/V1/directory/currency`;

      const requestData = {
        url: testUrl,
        method: "GET",
      };

      const authHeader = oauth.toHeader(oauth.authorize(requestData, token));

      const config = {
        method: requestData.method,
        url: requestData.url,
        maxBodyLength: Infinity,
        headers: {
          ...authHeader,
          "User-Agent": user_agent || "Botpress-Magento2-Integration",
          accept: "application/json",
        },
      };

      const response = await axios(config);

      if (response.status === 200) {
        logger.forBot().info("Magento2 configuration validation successful");
        logger.forBot().debug("Currency endpoint response:", response.data);
      } else {
        throw new sdk.RuntimeError(
          `Unexpected response status: ${response.status}`,
        );
      }
    } catch (error) {
      logger.forBot().error("Magento2 configuration validation failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      throw new sdk.RuntimeError(
        `Failed to validate Magento2 configuration: ${errorMessage}`,
      );
    }
  },
  unregister: async ({ logger }) => {
    logger.forBot().info("Unregistering Magento2 integration");
  },
  actions: {
    getProducts,
    getStockItem,
    syncProducts,
  },
  channels: {},
  handler: async ({ req, logger, ctx }) => {
    if (req.method !== "POST") {
      return {
        status: 405,
        body: JSON.stringify({
          success: false,
          message: "Method not allowed",
        }),
      };
    }

    try {
      const webhookData =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body;

      const eventType =
        webhookData?.event || webhookData?.type || webhookData?.data?.type;

      if (eventType === "magentoSyncContinue") {
        logger.forBot().info("Magento sync continue event received");

        try {
          const data = webhookData.data || webhookData;

          const {
            table_name,
            custom_columns_to_add_to_table,
            filters_json,
            retrieve_reviews,
            _currentPage,
            _totalCount,
            _tableId,
            _runId,
            _customAttributeCodes,
            _attributeMappings,
            _filterCriteria,
            _currentPageProductIndex,
          } = data;

          const result = await executeSyncProducts({
            ctx,
            input: {
              table_name,
              custom_columns_to_add_to_table,
              filters_json,
              retrieve_reviews,
              _currentPage,
              _totalCount,
              _tableId,
              _runId,
              _customAttributeCodes,
              _attributeMappings,
              _filterCriteria,
              _currentPageProductIndex,
            },
            logger,
          });

          logger.forBot().info("Sync continuation completed");

          return {
            status: 200,
            body: JSON.stringify({
              success: true,
              message: "Background processing completed successfully",
              result,
            }),
          };
        } catch (error) {
          logger.forBot().error(`Error continuing product sync: ${error}`);
          return {
            status: 500,
            body: JSON.stringify({
              success: false,
              message: `Background processing failed: ${error instanceof Error ? error.message : String(error)}`,
            }),
          };
        }
      } else {
        logger
          .forBot()
          .warn(`Unhandled webhook event type: ${eventType || "unknown"}`);
        return {
          status: 200,
          body: JSON.stringify({
            success: true,
            message: "Webhook received but not processed",
          }),
        };
      }
    } catch (error) {
      logger.forBot().error(`Unexpected error in handler: ${error}`);
      return {
        status: 500,
        body: JSON.stringify({
          success: false,
          message: `Error handling webhook: ${error instanceof Error ? error.message : String(error)}`,
        }),
      };
    }
  },
});
