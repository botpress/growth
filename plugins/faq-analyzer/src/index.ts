import * as bp from ".botpress";
import { Zai } from "@botpress/zai";
import { z } from '@bpinternal/zui';

// plugin client (it's just the botpress client) --> no need for vanilla
const getTableClient = (botClient: bp.Client): any => {
  return botClient as any;
};

function getTableName(props: any): string | undefined {
  let tableName =
    (props.configuration as { tableName?: string }).tableName ??
    "QuestionTable";
  tableName = tableName.replace(/\s+/g, "");
  if (!tableName || /^\d/.test(tableName)) {
    props.logger.error(
      "Table name must not start with a number. FAQ Table will not be created.",
    );
    return undefined;
  }
  if (!tableName.endsWith("Table")) {
    tableName += "Table";
  }
  return tableName;
}

interface BotpressApiError {
  code?: number;
  type?: string;
  message?: string;
}

const plugin = new bp.Plugin({
  actions: {},
});

plugin.on.beforeIncomingMessage("*", async (props) => {
  const schema = {
    question: { type: "string", searchable: true, nullable: true },
    count: { type: "number", nullable: true },
  };

  try {
    const tableName = getTableName(props);
    if (!tableName) {
      props.logger.error(
        "Something went wrong with the table name. FAQ Table will not be created.",
      );
      return undefined;
    }

    props.logger.info(
      `Creating table "${tableName}" with schema ${JSON.stringify(schema)}`,
    );

    const tableClient = getTableClient(props.client);

    try {
      await tableClient.getOrCreateTable({
        table: tableName,
        schema,
      });

      try {
        await tableClient.setState({
          type: "bot",
          id: props.ctx.botId,
          name: "table",
          payload: { tableCreated: true },
        });
      } catch (stateErr) {
        if (stateErr instanceof Error) {
          props.logger.warn(`Failed to set table state: ${stateErr.message}`);
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        props.logger.warn(`Table creation attempt: ${err.message}`);
      }
      try {
        await tableClient.setState({
          type: "bot",
          id: props.ctx.botId,
          name: "table",
          payload: { tableCreated: true },
        });
      } catch (stateErr) {
        if (stateErr instanceof Error) {
          props.logger.warn(`Failed to set state: ${stateErr.message}`);
        } else {
          props.logger.warn(`Failed to set state: ${String(stateErr)}`);
        }
      }
    }
  } catch (err) {
    if (err instanceof Error) {
      props.logger.error(`Failed to initialize table: ${err.message}`);
    }
  }

  return undefined;
});

plugin.on.afterIncomingMessage("*", async (props) => {
  const tableClient = getTableClient(props.client);
  const tableName = getTableName(props);
  if (!tableName) {
    props.logger.error("Table name is not set. FAQ Table will not be created.");
    return undefined;
  }

  let alreadyProcessed = undefined;
  try {
    alreadyProcessed = await tableClient.getState({
      type: "conversation",
      id: props.data.conversationId,
      name: "faqAnalyzed",
    });
  } catch (err) {
    const apiError = err as BotpressApiError;
    if (
      typeof apiError === "object" &&
      apiError &&
      apiError.code === 400 &&
      apiError.type === "ReferenceNotFound"
    ) {
      props.logger.debug(
        "FAQ analyzed state does not exist yet, treating as not processed",
      );
      alreadyProcessed = undefined;
    } else {
      if (err instanceof Error) {
        props.logger.warn(`Error checking FAQ state: ${err.message}`);
      }
    }
  }

  if (alreadyProcessed?.payload?.done) {
    props.logger.info("Conversation already processed. Skipping analysis.");
    return;
  }

  try {
    const { messages } = await props.client.listMessages({
      conversationId: props.data.conversationId,
    });

    messages.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    const userMessages = messages
      .filter((m) => m.direction === "incoming")
      .map((m) => m.payload?.text)
      .filter((text): text is string => Boolean(text));

    if (userMessages.length === 0) {
      props.logger.info(
        "User never interacted with the bot. Skipping analysis.",
      );
      return;
    }

    const fullUserMessages = userMessages.join("\n");
    const questionSchema = z.array(
      z.object({
        text: z.string(),
        normalizedText: z.string(),
      }),
    );

    const zai = new Zai({ client: getTableClient(props.client) });
    const extractedQuestions = await zai.extract(
      fullUserMessages,
      questionSchema,
      {
        instructions: `Extract all questions from this conversation. For each question:
              1. In the "text" field, extract the original question exactly as it appears
              2. In the "normalizedText" field, rewrite each as a complete standalone question:
                - For follow-up questions (like "what about X?"), transform it using the same pattern as the previous question
                - Always preserve the main subject of each question
                - Use the context of the conversation to make the question standalone
                - Remove question numbers or prefixes like "1." or "a."
                - Convert to lowercase and remove excess spacing or punctuation
              
              ONLY extract actual questions, not statements or commands.`,
      },
    );

    if (extractedQuestions && extractedQuestions.length > 0) {
      const { rows: existingRecords } = await tableClient.findTableRows({
        table: tableName,
        filter: {},
      });
      for (const question of extractedQuestions) {
        if (!question.normalizedText) continue;
        const normalizedQuestion = question.normalizedText.trim().toLowerCase();
        let similarQuestionFound = false;

        if (existingRecords.length > 0) {
          const existingQuestions = existingRecords.map((r: any) => r.question);
          const isSimilarToExisting = await zai.check(
            { newQuestion: normalizedQuestion, existingQuestions },
            `Determine if newQuestion is semantically equivalent to any question in existingQuestions.
              Return true ONLY if they are asking for the same information, even if phrased differently.`,
          );

          if (isSimilarToExisting) {
            const mostSimilarQuestion = await zai.extract(
              JSON.stringify({
                newQuestion: normalizedQuestion,
                existingQuestions,
              }),
              z.object({ mostSimilarQuestion: z.string() }) as any,
              {
                instructions: `Find the question in existingQuestions that is most semantically similar to newQuestion and return it exactly as written.`,
              },
            );

            if (
              mostSimilarQuestion &&
              mostSimilarQuestion.mostSimilarQuestion
            ) {
              const existingRecord = existingRecords.find(
                (r: any) =>
                  r.question === mostSimilarQuestion.mostSimilarQuestion,
              );
              if (existingRecord) {
                const currentCount = existingRecord.count || 0;
                await tableClient.updateTableRows({
                  table: tableName,
                  rows: [
                    {
                      id: existingRecord.id,
                      count: currentCount + 1,
                    },
                  ],
                });
                similarQuestionFound = true;
              }
            }
          }
        }

        if (!similarQuestionFound) {
          const exactMatch = existingRecords.find(
            (r: any) => r.question.trim().toLowerCase() === normalizedQuestion,
          );
          if (exactMatch) {
            const currentCount = exactMatch.count || 0;
            await tableClient.updateTableRows({
              table: tableName,
              rows: [
                {
                  id: exactMatch.id,
                  count: currentCount + 1,
                },
              ],
            });
          } else {
            await tableClient.createTableRows({
              table: tableName,
              rows: [
                {
                  question: normalizedQuestion,
                  count: 1,
                },
              ],
            });
          }
        }
      }
    }

    try {
      await tableClient.setState({
        type: "conversation",
        id: props.data.conversationId,
        name: "faqAnalyzed",
        payload: { done: true },
      });
      props.logger.info("Successfully marked conversation as analyzed");
    } catch (err) {
      if (err instanceof Error) {
        props.logger.warn(`Failed to set analyzed state: ${err.message}`);
      }
    }
  } catch (err) {
    props.logger.error(`Error analyzing FAQ details: ${JSON.stringify(err)}`);
    props.logger.error(`Error type: ${typeof err}`);

    if (err instanceof Error) {
      props.logger.error(`Error analyzing FAQ: ${err.message}`);
      props.logger.error(`Error stack: ${err.stack}`);
    }
  }
});

export default plugin;
