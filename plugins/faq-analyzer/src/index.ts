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
  
  if (alreadyProcessed?.payload?.done) {
    try {
      props.logger.debug(`Processing in incremental mode with ${userMessages.length} messages for context`);
      const recentMessages = userMessages.slice(-3);
      
      if (recentMessages.length === 0) {
        props.logger.info("No valid messages to process. Skipping.");
        return;
      }
      
      const recentContext = recentMessages.length > 1 ? recentMessages.slice(0, -1).join("\n") : "";
      const currentMessage = recentMessages[recentMessages.length - 1];

      if (!currentMessage) {
        props.logger.warn("Current message unexpectedly undefined after validation. Skipping.");
        return;
      }

      const isLikelyFollowUp = isMsgLikelyFollowUp(currentMessage);
      
      if (isLikelyFollowUp && recentContext) {
        props.logger.debug(`Detected likely follow-up question: "${currentMessage}" with context: "${recentContext}"`);
        
        try {
          const zai = new Zai({ client: tableClient });
          const contextualQuestion = await zai.extract(
            JSON.stringify({
              previousMessages: recentContext,
              followUpQuestion: currentMessage
            }),
            z.object({ 
              standaloneQuestion: z.string().describe("The follow-up question rewritten as a standalone question") 
            }),
            {
              instructions: `Given a conversation context and a follow-up question, rewrite the follow-up as a complete standalone question.
                For example:
                - Context: "how old is matthew?"
                - Follow-up: "what about joe?"
                - Standalone: "how old is joe?"
                
                Preserve the intent of the original question but make it fully self-contained.`
            }
          );
          
          if (contextualQuestion?.standaloneQuestion) {
            const standaloneQuestion = contextualQuestion.standaloneQuestion;
            props.logger.info(`Expanded follow-up question "${currentMessage}" to "${standaloneQuestion}"`);
            await processQuestion(props, tableClient, tableName, standaloneQuestion);
          } else {
            await processQuestion(props, tableClient, tableName, currentMessage);
          }
        } catch (err) {
          props.logger.warn(`Failed to expand follow-up question: ${err instanceof Error ? err.message : String(err)}`);
          await processQuestion(props, tableClient, tableName, currentMessage);
        }
      } else {
        await processQuestion(props, tableClient, tableName, currentMessage);
      }
    } catch (err) {
      props.logger.error(`Error during incremental processing: ${err instanceof Error ? err.message : String(err)}`);
      if (err instanceof Error) {
        props.logger.error(`Error stack: ${err.stack}`);
      }
    }
    return;
  }

  try {
    const fullUserMessages = userMessages.join("\n");
    props.logger.debug(`Filtering through ${userMessages.length} user messages: ${fullUserMessages}`);
    
    const questionSchema = z.array(
      z.object({
        text: z.string(),
        normalizedText: z.string(),
      }),
    );

    try {
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
                
                ONLY extract actual questions, not statements or commands.`
        }
      );

      if (extractedQuestions && extractedQuestions.length > 0) {
        props.logger.info(`Found ${extractedQuestions.length} questions in conversation`);
        
        const latestQuestion = extractedQuestions[extractedQuestions.length - 1];
        if (latestQuestion && latestQuestion.normalizedText) {
          await processQuestion(props, tableClient, tableName, latestQuestion.normalizedText);
        }
      } else {
        props.logger.info('No questions picked up by zai');
      }
    } catch (err) {
      props.logger.warn(`Extraction failed with error: ${err instanceof Error ? err.message : String(err)}`);
      props.logger.info("Falling back to direct message processing");
      
      const latestMsg = userMessages[userMessages.length - 1];
      if (latestMsg && latestMsg.trim().endsWith('?')) {
        await processQuestion(props, tableClient, tableName, latestMsg);
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
    props.logger.error(`Error during extraction: ${err instanceof Error ? err.message : String(err)}`);
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
    /^will they\b/i
  ];
  
  const isShort = msg.split(/\s+/).length <= 5;
  
  const matchesPattern = followUpPatterns.some(pattern => pattern.test(msg));
  
  const hasNoSubject = !(/\b(who|what|where|when|why|how)\b.*\b(is|are|was|were|do|does|did|has|have|had)\b/i.test(msg));
  
  return (isShort && (matchesPattern || hasNoSubject)) || matchesPattern;
}

async function processQuestion(props: any, tableClient: any, tableName: string, questionText: string) {
  const normalizedQuestion = questionText.trim().toLowerCase();
  
  props.logger.debug(`Processing question: "${normalizedQuestion}"`);
  
  let similarQuestionFound = false;
  
  try {
    const { rows: existingRecords } = await tableClient.findTableRows({
      table: tableName,
      filter: {},
    });
    
    if (existingRecords && existingRecords.length > 0) {
      const exactMatch = existingRecords.find(
        (r: any) => r.question.trim().toLowerCase() === normalizedQuestion
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
        props.logger.info(`Incremented count for exact question: "${exactMatch.question}" to ${currentCount + 1}`);
        return;
      }
      
      const existingQuestions = existingRecords.map((r: any) => r.question);
      
      const isLikelyEntityChange = existingQuestions.some((existingQ: string) => {
        const existingWords = existingQ.split(' ');
        const newWords = normalizedQuestion.split(' ');
        if (existingWords.length === newWords.length) {
          let diffCount = 0;
          for (let i = 0; i < existingWords.length; i++) {
            if (existingWords[i] !== newWords[i]) diffCount++;
          }
          if (diffCount === 1) {
            props.logger.info(`Detected likely entity/subject change between: "${existingQ}" and "${normalizedQuestion}". Treating as new question.`);
            return true;
          }
        }
        return false;
      });
      if (isLikelyEntityChange) {
        props.logger.info(`Skipping similarity check due to likely entity/subject change`);
      } else {
        props.logger.debug(`Checking similarity with ${existingQuestions.length} existing questions`);
        const zai = new Zai({ client: tableClient });
        const isSimilarToExisting = await zai.check(
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
            Questions with the same structure but different subjects/entities should be considered DIFFERENT.`,
        );

        if (isSimilarToExisting) {
          const mostSimilarQuestion = await zai.extract(
            JSON.stringify({
              newQuestion: normalizedQuestion,
              existingQuestions,
            }),
            z.object({ mostSimilarQuestion: z.string() }),
            {
              instructions: `Find the question in existingQuestions that is most semantically similar to newQuestion and return it exactly as written.
                Choose ONLY if they are asking about the same exact topic with the same intent.
                If nothing is very similar, return the empty string.`,
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
              const confirmSimilarity = await zai.check(
                { 
                  q1: normalizedQuestion, 
                  q2: existingRecord.question,
                  explanation: `Original: ${normalizedQuestion}\nCandidate: ${existingRecord.question}`
                },
                `Given two questions q1 and q2, determine if they are asking for the same information with the same intent.
                Return true ONLY if they are VERY similar questions seeking the same information about the SAME subject or entity.
                If they refer to different people, products, or entities, return false even if the question structure is identical.
                Examples:
                - "how old is matthew?" vs "how old is john?" -> FALSE (different people)
                - "what discounts do you offer?" vs "what discounts are available?" -> TRUE (same subject)
                Be strict - when in doubt, return false.`
              );
              
              if (confirmSimilarity) {
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
                props.logger.info(`Incremented count for similar question: "${existingRecord.question}" to ${currentCount + 1}`);
                similarQuestionFound = true;
              } else {
                props.logger.info(`Secondary check determined questions are not similar enough`);
              }
            }
          }
        }
      }
    }

    if (!similarQuestionFound) {
      await tableClient.createTableRows({
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
  } catch (err) {
    props.logger.error(`Error processing question "${normalizedQuestion}": ${err instanceof Error ? err.message : String(err)}`);
  }
}

export default plugin;
