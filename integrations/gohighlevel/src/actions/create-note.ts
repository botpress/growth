import { getClient } from '../client';
import { createNoteInputSchema, CreateNoteRequestBody } from '../misc/custom-schemas';
import type { Implementation } from '../misc/types';

export const createNote: Implementation['actions']['createNote'] = async ({ ctx, client, logger, input }) => {
  const validatedInput = createNoteInputSchema.parse(input);

  const ghlClient = getClient(ctx.configuration.accessToken, ctx.configuration.refreshToken, ctx.configuration.clientId, ctx.configuration.clientSecret, ctx, client);

  logger.forBot().debug(`Validated Input - ${JSON.stringify(validatedInput)}`);

  const noteData: CreateNoteRequestBody = {
    userId: validatedInput.userId,
    body: validatedInput.body
  };

  try {
    const result = await ghlClient.createNote(validatedInput.contactId, noteData);
    
    logger.forBot().info(`Successful - Create Note - ${JSON.stringify(validatedInput)}`);
    logger.forBot().info(`Result - ${JSON.stringify(result.data)}`);

    return { 
      success: result.success, 
      message: result.message, 
      data: result.data
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    logger.forBot().error(`'Create Note' exception: ${JSON.stringify(errorMessage)}`);

    return { 
      success: false, 
      message: errorMessage, 
      data: null 
    };
  }
};