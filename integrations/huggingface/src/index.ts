import * as sdk from "@botpress/sdk";
import { interfaces } from "@botpress/sdk";
import { HfInference } from "@huggingface/inference";
import * as bp from ".botpress";
import axios from "axios";
import { generateContent } from "./actions/generateContent";
import { fetchModel } from "./misc/client";

export default new bp.Integration({
  register: async ({ ctx, client, logger }) => {
    if (!ctx.configuration.languageModels) {
      logger.forBot().debug(`No models provided. Skipping...`);
      return;
    }

    const modelIds = ctx.configuration.languageModels
      .split(",")
      .map((el) => el.trim());

    if (modelIds.length > 10) {
      throw new sdk.RuntimeError(`Too many models provided`);
    }
    const languageModels: interfaces.llm.Model[] = [];
    for await (const id of modelIds) {
      try {
        const { modelId, pipeline_tag } = await fetchModel(id);

        if (pipeline_tag !== "text-generation") {
          logger
            .forBot()
            .debug(`Model ${id} is not a text generation model. Skipping...`);
          continue;
        }

        languageModels.push({
          id: modelId,
          name: modelId,
          description: modelId,
          tags: [],
          input: {
            costPer1MTokens: 0,
            maxTokens: 200000,
          },
          output: {
            costPer1MTokens: 0,
            maxTokens: 200000,
          },
        });
      } catch (e) {
        logger
          .forBot()
          .debug(
            `Error fetching model ${id}: ${
              e instanceof Error ? e.message : "Unknown Error"
            }`
          );
      }
    }

    await client.setState({
      type: "integration",
      name: "availableModels",
      id: ctx.integrationId,
      payload: { languageModels },
    });
  },
  unregister: async ({ client, ctx }) => {
    await client.setState({
      type: "integration",
      name: "availableModels",
      id: ctx.integrationId,
      payload: null,
    });
  },
  actions: {
    generateContent: async (
      props
    ): Promise<interfaces.llm.GenerateContentOutput> => {
      const { input, ctx, client } = props;

      const hf = new HfInference(ctx.configuration.accessToken);

      const { state } = await client.getState({
        type: "integration",
        name: "availableModels",
        id: ctx.integrationId,
      });

      const models = state.payload.languageModels;

      return await generateContent(
        <interfaces.llm.GenerateContentInput>input,
        hf,
        models
      );
    },

    listLanguageModels: async ({ ctx, client }) => {
      const { state } = await client.getState({
        type: "integration",
        name: "availableModels",
        id: ctx.integrationId,
      });

      const models = state.payload.languageModels;

      return {
        models,
      };
    },
  },
  channels: {},
  handler: async () => {},
});
