export const FOLLOW_UP_PATTERNS = [
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

export interface MostSimilarQuestionObject {
  mostSimilarQuestion: string;
}

export type MostSimilarQuestionResult = MostSimilarQuestionObject | MostSimilarQuestionObject[];

export const TABLE_SCHEMA = {
  question: { type: "string", searchable: true, nullable: true },
  count: { type: "number", nullable: true },
};

export const ZAI_EXTRACT_FOLLOW_UP_INSTRUCTIONS = `Given a conversation context and a follow-up question, rewrite the follow-up as a complete standalone question.
        For example:
        - Context: "how old is matthew?"
        - Follow-up: "what about joe?"
        - Standalone: "how old is joe?"
        
        Preserve the intent of the original question but make it fully self-contained.`;

export const ZAI_EXTRACT_SIMILAR_QUESTION_INSTRUCTIONS = `Find the question in existingQuestions that is most semantically similar to newQuestion.
        Return a JSON object with exactly one property named "mostSimilarQuestion" whose value is the most similar question as a string.
        For example: {"mostSimilarQuestion": "what are your offers?"}
        
        Do NOT return an array or any other format.
        Choose ONLY if they are asking about the same exact topic with the same intent.
        If nothing is very similar, return {"mostSimilarQuestion": ""}.`;

export const ZAI_EXTRACT_ALL_QUESTIONS_INSTRUCTIONS = `Extract all questions from this conversation. For each question:
              1. In the "text" field, extract the original question exactly as it appears
              2. In the "normalizedText" field, rewrite each as a complete standalone question:
                - For follow-up questions (like "what about X?"), transform it using the same pattern as the previous question
                - Always preserve the main subject of each question
                - Use the context of the conversation to make the question standalone
                - Remove question numbers or prefixes like "1." or "a."
                - Convert to lowercase and remove excess spacing or punctuation
              
              ONLY extract actual questions, not statements or commands.`;

export const ZAI_CHECK_SIMILARITY_INSTRUCTIONS = `Determine if newQuestion is semantically equivalent to any question in existingQuestions.
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
      Questions with the same structure but different subjects/entities should be considered DIFFERENT.`;

export const ZAI_CONFIRM_SIMILARITY_INSTRUCTIONS = `Given two questions q1 and q2, determine if they are asking for the same information with the same intent.
      Return true ONLY if they are VERY similar questions seeking the same information about the SAME subject or entity.
      If they refer to different people, products, or entities, return false even if the question structure is identical.
      Examples:
      - "how old is matthew?" vs "how old is john?" -> FALSE (different people)
      - "what discounts do you offer?" vs "what discounts are available?" -> TRUE (same subject)
      Be strict - when in doubt, return false.`; 