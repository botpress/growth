import { RuntimeError } from "@botpress/client";
import * as bp from ".botpress";
import { getAuthenticatedMailerLiteClient } from './client';

export const getAccessToken = async ({
  ctx,
}: {
  client: bp.Client;
  ctx: bp.Context;
}) => {
  const { APIKey } = ctx.configuration;

  if (!APIKey) {
    throw new RuntimeError("Access token not found in saved credentials");
  }
  return APIKey;
};

export const validateCredentials = async ({
  ctx,
  client,
}: {
  ctx: bp.Context;
  client: bp.Client;
}) => {
  try {
    const mlClient = await getAuthenticatedMailerLiteClient({ ctx, client });
    await mlClient.subscribers.get({ limit: 1 });
  } catch (error) {
    throw new RuntimeError(
      'Failed to validate MailerLite API key. Please confirm the key is correct and has the necessary permissions.'
    );
  }
};
