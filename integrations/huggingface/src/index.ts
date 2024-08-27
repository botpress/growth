import { interfaces } from "@botpress/sdk";
import { HfInference } from "@huggingface/inference";
import * as bp from ".botpress";
import axios from "axios";
import { generateContent } from "./actions/generateContent";

export default new bp.Integration({
  register: async ({ ctx, client, logger }) => {
    if (!ctx.configuration.languageModels) {
      return;
    }

    const modelIds = ctx.configuration.languageModels
      .split(",")
      .map((el) => el.trim());

    if (modelIds.length > 10) {
      logger.forBot().debug(`Too many models provided`);
      return;
    }
    const languageModels: interfaces.llm.Model[] = [];
    for await (const id of modelIds) {
      try {
        const { data }: { data: { modelId: string; pipeline_tag: string } } =
          await axios.get(`https://huggingface.co/api/models/${id}`);

        const modelId = data.modelId;

        if (data.pipeline_tag !== "text-generation") {
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
      payload: { languageModels: [] },
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
