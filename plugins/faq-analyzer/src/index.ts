import * as bp from ".botpress";
import { Zai } from "@botpress/zai";
import { z } from "@bpinternal/zui";
import type { table as TableState } from "../.botpress/implementation/typings/states";

interface Logger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

interface TableProps {
  configuration: {
    tableName?: string;
  };
  logger: Logger;
  client: bp.Client;
  ctx: {
    botId: string;
  };
  data: {
    conversationId: string;
  };
  event?: {
    createdAt: string;
    createdOn?: string;
  }
}

interface QuestionRecord {
  id: string;
  question: string;
  count: number;
}

interface FaqAnalyzedStatePayload {
  done: boolean;
  lastProcessedAt: string;
}

interface FaqAnalyzedState {
  payload: FaqAnalyzedStatePayload;
}

interface ExtractedQuestionData {
  text: string;
  normalizedText: string;
}

type QuestionExtractionZodSchema = z.ZodArray<
  z.ZodObject<{
    text: z.ZodString;
    normalizedText: z.ZodString;
  }>
>;

async function isTableCreated(
  tableClient: bp.Client,
  botId: string,
  logger: Logger,
): Promise<boolean> {
  try {

    const rawState = await tableClient.getState({
      type: "bot",
      id: botId,
      name: "table",
    });

    const state = (rawState && 'payload' in rawState)
      ? (rawState as { payload: TableState.Table['payload'] })
      : undefined;

    return !!state?.payload?.tableCreated;
  } catch (err) {
    if (err instanceof Error) {
      logger.debug(`Table state check: ${err.message}`);
    }
    return false;
  }
}

async function setBotTableState(
  tableClient: bp.Client,
  botId: string,
  logger: Logger,
): Promise<void> {
  try {
    await tableClient.setState({
      type: "bot",
      id: botId,
      name: "table",
      payload: { tableCreated: true },
    });
  } catch (stateErr) {
    if (stateErr instanceof Error) {
      logger.warn(`Failed to set table state: ${stateErr.message}`);
    } else {
      logger.warn(`Failed to set state: ${String(stateErr)}`);
    }
  }
}

async function safeCreateTableAndSetState(
  tableClient: bp.Client,
  tableName: string,
  botId: string,
  logger: Logger,
): Promise<void> {
  try {
    await createTableAndSetState(tableClient, tableName, botId, logger);
  } catch (err) {
    if (err instanceof Error) {
      logger.warn(`Table creation attempt: ${err.message}`);
    }
    await setBotTableState(tableClient, botId, logger);
  }
}

const schema = {
  question: { type: "string", searchable: true, nullable: true },
  count: { type: "number", nullable: true },
};

// plugin client (it's just the botpress client) --> no need for vanilla
const getTableClient = (botClient: bp.Client): any => {
  return botClient as any;
};

function getTableName(props: TableProps): string | undefined {
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

async function createTableAndSetState(
  tableClient: bp.Client,
  tableName: string,
  botId: string,
  logger: Logger,
): Promise<void> {
  try {
    await (tableClient as any).getOrCreateTable({
      table: tableName,
      schema,
    });

    await setBotTableState(tableClient, botId, logger);
  } catch (err) {
    if (err instanceof Error) {
      logger.warn(`Table creation attempt: ${err.message}`);
    }
    await setBotTableState(tableClient, botId, logger);
  }
}

plugin.on.beforeIncomingMessage("*", async (props) => {
  try {
    const tableName = getTableName(props);
    if (!tableName) {
      props.logger.error(
        "Something went wrong with the table name. FAQ Table will not be created.",
      );
      return undefined;
    }

    const tableClient = getTableClient(props.client);

    const tableAlreadyCreated = await isTableCreated(
      tableClient,
      props.ctx.botId,
      props.logger,
    );

    if (tableAlreadyCreated) {
      props.logger.debug(
        `Table "${tableName}" already created, skipping creation`,
      );
      return undefined;
    }

    props.logger.info(
      `Creating table "${tableName}" with schema ${JSON.stringify(schema)}`,
    );

    await safeCreateTableAndSetState(
      tableClient,
      tableName,
      props.ctx.botId,
      props.logger,
    );
  } catch (err) {
    if (err instanceof Error) {
      props.logger.error(`Failed to initialize table: ${err.message}`);
    } else {
      props.logger.error(`Failed to initialize table: ${String(err)}`);
    }
  }

  return undefined;
});

async function handleIncrementalProcessing(
  props: TableProps,
  tableClient: bp.Client,
  tableName: string,
  userMessages: string[]
): Promise<void> {
  try {
    props.logger.debug(
      `Processing in incremental mode with ${userMessages.length} messages for context`,
    );
    const recentMessages = userMessages.slice(-3);

    if (recentMessages.length === 0) {
      props.logger.info("No valid messages to process. Skipping.");
      return;
    }

    const recentContext =
      recentMessages.length > 1 ? recentMessages.slice(0, -1).join("\n") : "";
    const currentMessage = recentMessages[recentMessages.length - 1];

    if (!currentMessage) {
      props.logger.warn(
        "Current message unexpectedly undefined after validation. Skipping.",
      );
      return;
    }

    await processRecentMessage(props, tableClient, tableName, currentMessage, recentContext);
  } catch (err) {
    logIncrementalProcessingError(props, err);
  }
}

async function processRecentMessage(
  props: TableProps,
  tableClient: bp.Client,
  tableName: string,
  currentMessage: string,
  recentContext: string
): Promise<void> {
  const isLikelyFollowUp = isMsgLikelyFollowUp(currentMessage);

  if (isLikelyFollowUp && recentContext) {
    await handleFollowUpQuestion(props, tableClient, tableName, currentMessage, recentContext);
  } else {
    await processQuestion(props, tableClient, tableName, currentMessage);
  }
}

async function handleFollowUpQuestion(
  props: TableProps,
  tableClient: bp.Client,
  tableName: string,
  currentMessage: string,
  recentContext: string
): Promise<void> {
  props.logger.debug(
    `Detected likely follow-up question: "${currentMessage}" with context: "${recentContext}"`,
  );

  try {
    const standaloneQuestion = await expandFollowUpQuestion(tableClient, currentMessage, recentContext);
    
    if (standaloneQuestion) {
      props.logger.info(
        `Expanded follow-up question "${currentMessage}" to "${standaloneQuestion}"`,
      );
      await processQuestion(props, tableClient, tableName, standaloneQuestion);
    } else {
      await processQuestion(props, tableClient, tableName, currentMessage);
    }
  } catch (err) {
    props.logger.warn(
      `Failed to expand follow-up question: ${err instanceof Error ? err.message : String(err)}`,
    );
    await processQuestion(props, tableClient, tableName, currentMessage);
  }
}

async function expandFollowUpQuestion(
  tableClient: bp.Client,
  followUpQuestion: string,
  context: string
): Promise<string | undefined> {
  const zai = new Zai({ client: tableClient });
  const contextualQuestion = await zai.extract(
    JSON.stringify({
      previousMessages: context,
      followUpQuestion: followUpQuestion,
    }),
    z.object({
      standaloneQuestion: z
        .string()
        .describe(
          "The follow-up question rewritten as a standalone question",
        ),
    }),
    {
      instructions: `Given a conversation context and a follow-up question, rewrite the follow-up as a complete standalone question.
        For example:
        - Context: "how old is matthew?"
        - Follow-up: "what about joe?"
        - Standalone: "how old is joe?"
        
        Preserve the intent of the original question but make it fully self-contained.`,
    },
  );

  return contextualQuestion?.standaloneQuestion;
}

function _extractMostSimilarQuestionFromResult(mostSimilarQuestionResult: any): string | null {
  if (!mostSimilarQuestionResult) {
    return null;
  }

  if (Array.isArray(mostSimilarQuestionResult)) {
    const foundItem = mostSimilarQuestionResult.find(
      (item: any) => typeof item === 'object' && item && 'mostSimilarQuestion' in item
    );
    return foundItem ? foundItem.mostSimilarQuestion : null;
  } else if (typeof mostSimilarQuestionResult === 'object' && 'mostSimilarQuestion' in mostSimilarQuestionResult) {
    return (mostSimilarQuestionResult as { mostSimilarQuestion: string }).mostSimilarQuestion;
  }

  return null;
}

async function getMostSimilarQuestion(
  zai: any,
  normalizedQuestion: string,
  existingQuestions: string[]
): Promise<string | null> {
  const mostSimilarQuestionResult = await zai.extract(
    JSON.stringify({
      newQuestion: normalizedQuestion,
      existingQuestions,
    }),
    z.union([
      z.object({ mostSimilarQuestion: z.string() }),
      z.array(z.object({ mostSimilarQuestion: z.string() }))
    ]),
    {
      instructions: `Find the question in existingQuestions that is most semantically similar to newQuestion.
        Return a JSON object with exactly one property named "mostSimilarQuestion" whose value is the most similar question as a string.
        For example: {"mostSimilarQuestion": "what are your offers?"}
        
        Do NOT return an array or any other format.
        Choose ONLY if they are asking about the same exact topic with the same intent.
        If nothing is very similar, return {"mostSimilarQuestion": ""}.`,
    }
  );

  return _extractMostSimilarQuestionFromResult(mostSimilarQuestionResult);
}

function logIncrementalProcessingError(props: TableProps, err: unknown): void {
  props.logger.error(
    `Error during incremental processing: ${err instanceof Error ? err.message : String(err)}`,
  );
  if (err instanceof Error) {
    props.logger.error(`Error stack: ${err.stack}`);
  }
}

async function markConversationAsAnalyzed(
  tableClient: bp.Client,
  conversationId: string,
  logger: Logger,
  eventCreatedAt: string | undefined,
): Promise<void> {
  try {
    let currentState: FaqAnalyzedState | undefined;
    try {
      const rawState = await tableClient.getState({
        type: "conversation",
        id: conversationId,
        name: "faqAnalyzed",
      })
      currentState = (rawState && 'payload' in rawState)
        ? (rawState as { payload: FaqAnalyzedState['payload'] })
        : undefined;
    } catch {
      currentState = undefined
    }

    const currentTs = currentState?.payload?.lastProcessedAt

    if (
      !eventCreatedAt ||
      !currentTs ||
      new Date(eventCreatedAt).getTime() > new Date(currentTs).getTime()
    ) {
      await tableClient.setState({
        type: "conversation",
        id: conversationId,
        name: "faqAnalyzed",
        payload: { done: true, lastProcessedAt: eventCreatedAt },
      })
    }
    logger.info("Successfully marked conversation as analyzed")
  } catch (err) {
    if (err instanceof Error) {
      logger.warn(`Failed to set analyzed state: ${err.message}`)
    } else {
      logger.warn(`Failed to set analyzed state: ${String(err)}`)
    }
  }
}

async function extractAndProcessQuestions(
  props: TableProps,
  tableClient: bp.Client,
  tableName: string,
  fullUserMessages: string,
  userMessages: string[],
  questionSchema: QuestionExtractionZodSchema
): Promise<void> {
  try {
    const zai = new Zai({ client: getTableClient(props.client) });
    const extractedQuestions: ExtractedQuestionData[] | undefined = await zai.extract(
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
      props.logger.info(
        `Found ${extractedQuestions.length} questions in conversation`,
      );

      const latestQuestion =
        extractedQuestions[extractedQuestions.length - 1];
      if (latestQuestion && latestQuestion.normalizedText) {
        await processQuestion(
          props,
          tableClient,
          tableName,
          latestQuestion.normalizedText,
        );
      }
    } else {
      props.logger.info("No questions picked up by zai");
    }
  } catch (err) {
    props.logger.warn(
      `Extraction failed with error: ${err instanceof Error ? err.message : String(err)}`,
    );
    props.logger.info("Falling back to direct message processing");

    const latestMsg = userMessages[userMessages.length - 1];
    if (latestMsg && latestMsg.trim().endsWith("?")) {
      await processQuestion(props, tableClient, tableName, latestMsg);
    }
  }
}

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

  const { messages } = await props.client.listMessages({
    conversationId: props.data.conversationId,
  });

  const eventCreatedAt =
    (props as any).event?.createdAt ?? (props as any).event?.createdOn;
  const lastProcessedAt = (alreadyProcessed as any)?.payload?.lastProcessedAt;

  if (lastProcessedAt && eventCreatedAt) {
    const eventTs = new Date(eventCreatedAt).getTime();
    const lastTs = new Date(lastProcessedAt).getTime();
    if (eventTs <= lastTs) {
      props.logger.debug(
        `Skipping message already processed. eventTs=${eventTs} lastTs=${lastTs}`,
      );
      return;
    }
  }

  messages.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const limitedMessages = eventCreatedAt
    ? messages.filter(
        (m) =>
          new Date(m.createdAt).getTime() <= new Date(eventCreatedAt).getTime(),
      )
    : messages;

  const userMessages = limitedMessages
    .filter((m) => m.direction === "incoming")
    .map((m) => m.payload?.text)
    .filter((text): text is string => Boolean(text));

  if (userMessages.length === 0) {
    props.logger.info("User never interacted with the bot. Skipping analysis.");
    return;
  }

  if ((alreadyProcessed as any)?.payload?.done) {
    await handleIncrementalProcessing(props, tableClient, tableName, userMessages);
    await markConversationAsAnalyzed(
      tableClient,
      props.data.conversationId,
      props.logger,
      eventCreatedAt,
    );
    return;
  }

  try {
    const fullUserMessages = userMessages.join("\n");
    props.logger.debug(
      `Filtering through ${userMessages.length} user messages: ${fullUserMessages}`,
    );

    const questionSchema = z.array(
      z.object({
        text: z.string(),
        normalizedText: z.string(),
      }),
    );

    await extractAndProcessQuestions(
      props,
      tableClient,
      tableName,
      fullUserMessages,
      userMessages,
      questionSchema
    );

    await markConversationAsAnalyzed(
      tableClient,
      props.data.conversationId,
      props.logger,
      eventCreatedAt,
    );
  } catch (err) {
    props.logger.error(
      `Error during extraction: ${err instanceof Error ? err.message : String(err)}`,
    );
    props.logger.error(`Error type: ${typeof err}`);

    if (err instanceof Error) {
      props.logger.error(`Error analyzing FAQ: ${err.message}`);
      props.logger.error(`Error stack: ${err.stack}`);
    }
  }
});

function isMsgLikelyFollowUp(msg: string): boolean {
  const followUpPatterns = [
    /^what about\b/i,
    /^how about\b/i,
    /^and\b/i,
    /^what if\b/i,
    /^is it\b/i,
    /^are they\b/i,
    /^does it\b/i,
    /^do they\b/i,
    /^can they\b/i,
    /^can it\b/i,
    /^will it\b/i,
    /^will they\b/i,
  ];

  const isShort = msg.split(/\s+/).length <= 5;

  const matchesPattern = followUpPatterns.some((pattern) => pattern.test(msg));

  const hasNoSubject =
    !/\b(who|what|where|when|why|how)\b.*\b(is|are|was|were|do|does|did|has|have|had)\b/i.test(
      msg,
    );

  return (isShort && (matchesPattern || hasNoSubject)) || matchesPattern;
}

async function handleExactMatch(
  tableClient: bp.Client,
  tableName: string,
  existingRecord: QuestionRecord,
  props: TableProps
): Promise<boolean> {
  const currentCount = existingRecord.count || 0;
  await (tableClient as any).updateTableRows({
    table: tableName,
    rows: [
      {
        id: existingRecord.id,
        count: currentCount + 1,
      },
    ],
  });
  props.logger.info(
    `Incremented count for exact question: "${existingRecord.question}" to ${currentCount + 1}`
  );
  return true;
}

function isLikelyEntityChange(
  existingQuestions: string[],
  normalizedQuestion: string,
  props: TableProps
): boolean {
  return existingQuestions.some((existingQ: string) => {
    const existingWords = existingQ.split(" ");
    const newWords = normalizedQuestion.split(" ");
    if (existingWords.length === newWords.length) {
      let diffCount = 0;
      for (let i = 0; i < existingWords.length; i++) {
        if (existingWords[i] !== newWords[i]) diffCount++;
      }
      if (diffCount === 1) {
        props.logger.info(
          `Detected likely entity/subject change between: "${existingQ}" and "${normalizedQuestion}". Treating as new question.`
        );
        return true;
      }
    }
    return false;
  });
}

async function checkSimilarity(
  zai: any,
  normalizedQuestion: string,
  existingQuestions: string[],
  props: TableProps
): Promise<boolean> {
  props.logger.debug(
    `Checking similarity with ${existingQuestions.length} existing questions`
  );
  
  return await zai.check(
    { newQuestion: normalizedQuestion, existingQuestions },
    `Determine if newQuestion is semantically equivalent to any question in existingQuestions.
      Return true ONLY if they are asking for the same information with the same intent, even if phrased differently.
      Examples of equivalent questions:
      - "can i switch my medicare plan anytime" and "can i switch the medicare plan at any time?" (SAME)
      - "how do I reset my password" and "how to reset password" (SAME)
      - "what are your offers" and "are discounts and promotions different" (DIFFERENT)
      - "what services do you provide" and "do you offer any discounts" (DIFFERENT)
      - "how old is matthew" and "how old is john" (DIFFERENT) - different subjects matter
      - "what about X" and "what about Y" (DIFFERENT) - different entities should be treated as different questions
      Return false if they are substantively different questions, ask about different topics, have different intents, or refer to different entities/people.
      Be strict about similarity - when in doubt, return false.
      Questions with the same structure but different subjects/entities should be considered DIFFERENT.`
  );
}

async function confirmAndUpdateSimilarQuestion(
  zai: any,
  tableClient: bp.Client,
  tableName: string,
  normalizedQuestion: string,
  existingRecord: QuestionRecord,
  props: TableProps
): Promise<boolean> {
  const confirmSimilarity = await zai.check(
    {
      q1: normalizedQuestion,
      q2: existingRecord.question,
      explanation: `Original: ${normalizedQuestion}\nCandidate: ${existingRecord.question}`,
    },
    `Given two questions q1 and q2, determine if they are asking for the same information with the same intent.
      Return true ONLY if they are VERY similar questions seeking the same information about the SAME subject or entity.
      If they refer to different people, products, or entities, return false even if the question structure is identical.
      Examples:
      - "how old is matthew?" vs "how old is john?" -> FALSE (different people)
      - "what discounts do you offer?" vs "what discounts are available?" -> TRUE (same subject)
      Be strict - when in doubt, return false.`
  );

  if (!confirmSimilarity) {
    props.logger.info(`Secondary check determined questions are not similar enough`);
    return false;
  }

  const currentCount = existingRecord.count || 0;
  await (tableClient as any).updateTableRows({
    table: tableName,
    rows: [
      {
        id: existingRecord.id,
        count: currentCount + 1,
      },
    ],
  });
  props.logger.info(
    `Incremented count for similar question: "${existingRecord.question}" to ${currentCount + 1}`
  );
  return true;
}

async function addNewQuestion(
  tableClient: bp.Client,
  tableName: string,
  normalizedQuestion: string,
  props: TableProps
): Promise<void> {
  await (tableClient as any).createTableRows({
    table: tableName,
    rows: [
      {
        question: normalizedQuestion,
        count: 1,
      },
    ],
  });
  props.logger.info(`Added new question to tracking: "${normalizedQuestion}"`);
}

async function processExistingRecords(
  tableClient: bp.Client,
  tableName: string,
  normalizedQuestion: string,
  existingRecords: QuestionRecord[],
  props: TableProps
): Promise<boolean> {
  const exactMatch = existingRecords.find(
    (r: QuestionRecord) => r.question.trim().toLowerCase() === normalizedQuestion
  );

  if (exactMatch) {
    return await handleExactMatch(tableClient, tableName, exactMatch, props);
  }

  const existingQuestions = existingRecords.map((r: QuestionRecord) => r.question);

  if (isLikelyEntityChange(existingQuestions, normalizedQuestion, props)) {
    props.logger.info(`Skipping similarity check due to likely entity/subject change`);
    return false;
  }

  const zai = new Zai({ client: tableClient });
  const isSimilarToExisting = await checkSimilarity(
    zai, 
    normalizedQuestion, 
    existingQuestions, 
    props
  );

  if (!isSimilarToExisting) {
    return false;
  }

  const mostSimilarQuestion = await getMostSimilarQuestion(
    zai,
    normalizedQuestion,
    existingQuestions
  );

  if (!mostSimilarQuestion) {
    props.logger.info(
      `Zai did not identify a clear similar question or returned an uninterpretable format for "${normalizedQuestion}". Proceeding to treat as new question.`
    );
    return false;
  }

  const existingRecord = existingRecords.find(
    (r: QuestionRecord) => r.question === mostSimilarQuestion
  );

  if (!existingRecord) {
    return false;
  }

  return await confirmAndUpdateSimilarQuestion(
    zai,
    tableClient,
    tableName,
    normalizedQuestion,
    existingRecord,
    props
  );
}

async function processQuestion(
  props: TableProps,
  tableClient: bp.Client,
  tableName: string,
  questionText: string,
) {
  const normalizedQuestion = questionText
  .trim()
  .toLowerCase()
  .replace(/\?+$/, "")
  .trim();
  props.logger.debug(`Processing question: "${normalizedQuestion}"`);
  
  let similarQuestionFound = false;

  try {
    const { rows: existingRecords } = await (tableClient as any).findTableRows({
      table: tableName,
      filter: {},
    });

    if (existingRecords && existingRecords.length > 0) {
      similarQuestionFound = await processExistingRecords(
        tableClient,
        tableName,
        normalizedQuestion,
        existingRecords as QuestionRecord[],
        props
      );
    }

    if (!similarQuestionFound) {
      await addNewQuestion(tableClient, tableName, normalizedQuestion, props);
    }
  } catch (err) {
    props.logger.error(
      `Error processing question "${normalizedQuestion}": ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

export default plugin;
