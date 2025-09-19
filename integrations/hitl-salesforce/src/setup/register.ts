import { RuntimeError } from "@botpress/client";
import axios from 'axios';
import type { RegisterFunction } from '../misc/types';
import * as bp from '.botpress';

interface ValidationResponse {
  allowed: boolean;
  id: string;
}

async function validateBotId(botId: string, logger: bp.Logger) {

    // Get validation endpoint URL from secrets
    const validationEndpointUrl = bp.secrets.VALIDATION_ENDPOINT_URL;
    const validationSecret = bp.secrets.VALIDATION_SECRET

    // Skip validation if endpoint URL is not configured
    if (!validationEndpointUrl || validationEndpointUrl.trim() === '') {
        logger.forBot().info("Validation endpoint URL is not configured. Skipping workspace validation.");
        return
    }
    
    try {
        const response = await axios.post<ValidationResponse>(
          validationEndpointUrl,
          { botId },
          {
              headers: {
                  "Content-Type": "application/json",
                  "X-API-Key": `${validationSecret}`,
              },
              timeout: 10000, // 10 second timeout
          }
        );


        if (!response?.data?.allowed) {
            logger.forBot().error(`Bot "${botId}" is not allowed to use this integration`);
            throw new RuntimeError(
                `Bot "${botId}" is not authorized to use this integration. Please contact support.`
            );
        }

        logger.forBot().info(`Bot validation successful for ${botId}`);

        logger.forBot().info("Salesforce HITL integration registered successfully.");
        
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(`Validation request failed: ${error.message}`);
        }
        throw error
    }
}

export const register: RegisterFunction = async ({ ctx, logger }) => {
  try {

    // Validate workspace access
    logger.forBot().info(`Validating integration access for bot "${ctx.botId}"`);

    await validateBotId(ctx.botId, logger);

  } catch (error) {
    logger.forBot().error("Error during integration registration:", error);
    
    if (error instanceof RuntimeError) {
      throw error;
    }
    
    throw new RuntimeError(
      `Configuration Error! Unable to validate bot access: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};
