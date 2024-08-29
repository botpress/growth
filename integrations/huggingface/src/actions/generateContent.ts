import { InvalidPayloadError } from "@botpress/client";
import * as sdk from "@botpress/sdk";
import { interfaces } from "@botpress/sdk";
import type { HfInference } from "@huggingface/inference";

type HfToolCalls = Awaited<
  ReturnType<HfInference["chatCompletion"]>
>["choices"][number]["message"]["tool_calls"];

function mapToolCalls(
  hfToolCalls: HfToolCalls
): sdk.interfaces.llm.ToolCall[] | undefined {
  return hfToolCalls
    ?.filter((toolCall) => toolCall.type === "function")
    .map((toolCall) => ({
      id: `${toolCall.id}`,
      type: toolCall.type as "function",
      function: {
        name: toolCall.function.name,
        arguments: toolCall.function.arguments as Record<string, any> | null,
      },
    }));
}

function mapToStopReason(hfFinishReason: string) {
  switch (hfFinishReason) {
    case "length":
      return "max_tokens";
    case "stop":
      return "stop";
    case "content_filter":
      return "content_filter";
    case "tool_calls":
      return "tool_calls";
    default:
      return "other";
  }
}

export async function generateContent(
  input: interfaces.llm.GenerateContentInput,
  hf: HfInference,
  models: interfaces.llm.Model[]
): Promise<interfaces.llm.GenerateContentOutput> {
  if (!input.model?.id) {
    throw new InvalidPayloadError("Model ID not provided");
  }

  const modelId = input.model.id;

  const model = models.find((model) => model.id === modelId);

  if (!model) {
    throw new InvalidPayloadError(
      `Model ID "${modelId}" is not allowed by this integration`
    );
  }

  if (input.messages.length === 0 && !input.systemPrompt) {
    throw new InvalidPayloadError(
      "At least one message or a system prompt is required"
    );
  }

  if (input.maxTokens && input.maxTokens > model.output.maxTokens) {
    throw new InvalidPayloadError(
      `maxTokens must be less than or equal to ${model.output.maxTokens} for model ID "${modelId}`
    );
  }

  if (input.responseFormat === "json_object") {
    input.systemPrompt =
      (input.systemPrompt || "") +
      "\n\nYour response must always be in valid JSON format and expressed as a JSON object.";
  }

  const messages = [
    { role: "system", content: input.systemPrompt },
    ...input.messages,
  ];

  const request = {
    model: modelId,
    messages,
    temperature: input.temperature,
  };

  try {
    const response = await hf.chatCompletion(request);

    const formattedResponse = {
      id: response.id,
      model: response.model,
      provider: response.model,
      choices: response.choices.map((choice) => ({
        index: choice.index,
        role: "assistant",
        type: "text",
        content: choice.message.content,
        stopReason: mapToStopReason(choice.finish_reason),
        toolCalls: mapToolCalls(choice.message.tool_calls),
      })),
      usage: {
        inputTokens: response.usage.prompt_tokens,
        outputTokens: response.usage.completion_tokens,
        //User is charged by HF
        inputCost: 0,
        outputCost: 0,
      },
    } satisfies interfaces.llm.GenerateContentOutput;

    return formattedResponse;
  } catch (e) {
    throw new sdk.RuntimeError(
      `Error calling the model: ${
        e instanceof Error ? e.message : "Unknown error"
      }`
    );
  }
}
