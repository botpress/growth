import * as sdk from "@botpress/sdk";
import * as bp from ".botpress";
import { BotpressKB } from "./BotpressKB";
import { createSharepointClient } from "./SharepointClient";
import { log } from "console";

export default new bp.Integration({
  register: async ({ ctx, webhookUrl, client, logger }) => {
    try {
      const spClient = createSharepointClient(ctx.configuration, new BotpressKB(client, logger));

      logger.forBot().info(`[Registeration]: Registering webhook with URL: ${webhookUrl}`);
      const webhookSubscriptionId = await spClient.registerWebhook(webhookUrl);
      logger.forBot().info(`[Registeration]: Webhook registered successfully with ID: ${webhookSubscriptionId}`);

      logger.forBot().info(`[Registeration]: Initializing items in KB`);
      await spClient.loadAllDocumentsIntoBotpressKB();
      logger.forBot().info(`[Registeration]: Items initialized successfully`);

      logger.forBot().info(`[Registeration]: Getting latest change token`);
      const changeToken = await spClient.getLatestChangeToken();
      if (!changeToken) {
        throw new sdk.RuntimeError(`Error getting change token`);
      }
      logger.forBot().info(`[Registeration]: Change token initialized successfully`);

      await client.setState({
        type: "integration",
        name: "configuration",
        id: ctx.integrationId,
        payload: {
          webhookSubscriptionId,
          changeToken,
        },
      });
    } catch (e) {
      throw new sdk.RuntimeError(`Error registering integration: ${e}`);
    }
  },
  unregister: async ({ client, ctx, logger }) => {
    try {
      const { state } = await client.getState({
        type: "integration",
        name: "configuration",
        id: ctx.integrationId,
      });

      logger.forBot().info(`Unregistering webhook with ID: ${state.payload.webhookSubscriptionId}`);

      if (state.payload.webhookSubscriptionId.length) {
        const spClient = createSharepointClient(ctx.configuration, new BotpressKB(client, logger));

        spClient.unregisterWebhook(state.payload.webhookSubscriptionId);

        logger.forBot().info(`Webhook unregistered successfully`);
      }
    } catch (e) {
      throw new sdk.RuntimeError(`Error unregistering webhook: ${e}`);
    }
  },
  actions: {
    testFunction: async () => {
      // const {
      //   state: {
      //     payload: { listId, changeToken, webhookSubscriptionId },
      //   },
      // } = await client.getState({
      //   type: "integration",
      //   name: "configuration",
      //   id: ctx.integrationId,
      // });

      // // @ts-expect-error - TODO: Fix this
      // const spClient = getClient(ctx.configuration, new BotpressKB(client));
      // // Process changes
      // const newChangeToken = await spClient.processChanges(listId, changeToken);

      // // Update the change token
      // await client.setState({
      //   type: "integration",
      //   name: "configuration",
      //   id: ctx.integrationId,
      //   payload: {
      //     webhookSubscriptionId,
      //     listId,
      //     changeToken: newChangeToken,
      //   },
      // });
      return {};
    },
  },
  channels: {},
  handler: async ({ ctx, req, client, logger }) => {
    logger.forBot().info(`Received webhook call`);
    // Check if this is a validation request
    const isValidationRequest = req.query.includes("validationtoken");
    if (isValidationRequest) {
      const validationToken = req.query.split("=")[1];
      logger.forBot().info(`Validation request received with token: ${validationToken}`);
      return { status: 200, body: validationToken };
    }

    // Note: We are skipping validation under few assumptions:
    // - The webhook is not public ( user responsible for securing the webhook, additional security measures can be added )
    // - The webhook is receiving notifications for the correct sharepoint site and list / library ( This is ensured as the subscription is created for a specific list / library )

    const spClient = createSharepointClient(ctx.configuration, new BotpressKB(client, logger));

    const {
      state: {
        payload: { changeToken, webhookSubscriptionId },
      },
    } = await client.getState({
      type: "integration",
      name: "configuration",
      id: ctx.integrationId,
    });

    // Process changes
    const newChangeToken = await spClient.syncSharepointDocumentLibraryAndBotpressKB(changeToken);

    // Update the change token
    await client.setState({
      type: "integration",
      name: "configuration",
      id: ctx.integrationId,
      payload: {
        webhookSubscriptionId,
        changeToken: newChangeToken,
      },
    });

    return { status: 200, body: "OK" };
  },
});
