import { getClient } from '../client';
import { searchContactsInputSchema } from '../misc/custom-schemas';
import type { Implementation } from '../misc/types';

export const searchContacts: Implementation['actions']['searchContacts'] = async ({ ctx, client, logger, input }: {
  ctx: any;
  client: any;
  logger: any;
  input: any;
}) => {
  const validatedInput = searchContactsInputSchema.parse(input);
  const ghlClient = getClient(ctx.configuration.accessToken, ctx.configuration.refreshToken, ctx.configuration.clientId, ctx.configuration.clientSecret, ctx, client);

  logger.forBot().debug(`Validated Input - ${JSON.stringify(validatedInput)}`);

  try {
    const result = await ghlClient.searchContacts(validatedInput.locationId, validatedInput.phone);
    
    logger.forBot().info(`Successful - Search Contacts - ${JSON.stringify(validatedInput)}`);
    logger.forBot().info(`Result - ${JSON.stringify(result.data)}`);

    return { 
      success: result.success, 
      message: result.message, 
      data: result.data
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    logger.forBot().error(`'Search Contacts' exception: ${JSON.stringify(errorMessage)}`);

    return { 
      success: false, 
      message: errorMessage, 
      data: null 
    };
  }
};