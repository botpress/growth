import { Client, Context, Logger } from "../types";
import { OAuth2, Connection } from "jsforce";
import * as bp from ".botpress";

export const getOAuth2 = (): OAuth2 =>
  new OAuth2({
    clientId: bp.secrets.CONSUMER_KEY,
    clientSecret: bp.secrets.CONSUMER_SECRET,
    redirectUri:
      "https://webhook.botpress.cloud/integration/intver_01J0PAK7GPBNW7H959MZQRX6N9/oath",
  });

export const getConnection = async (
  client: Client,
  ctx: Context,
  logger: Logger
): Promise<Connection> => {
  let payload: bp.states.credentials.Credentials;
  try {
    const {
      state: { payload: receivedPayload },
    } = await client.getState({
      type: "integration",
      name: "credentials",
      id: ctx.integrationId,
    });
    payload = receivedPayload;
  } catch (e) {
    logger
      .forBot()
      .error(`Error fetching Salesforce credentials: ${JSON.stringify(e)}`);

    throw new Error(
      `Error fetching Salesforce credentials: ${JSON.stringify(e)}`
    );
  }

  const { accessToken, instanceUrl, refreshToken } = payload;

  const connection = new Connection({
    oauth2: getOAuth2(),
    instanceUrl,
    accessToken,
    refreshToken,
  });

  connection.on("refresh", async (newAccessToken: string) => {
    await client.setState({
      type: "integration",
      name: "credentials",
      id: ctx.integrationId,
      payload: {
        accessToken: newAccessToken,
        instanceUrl,
        refreshToken,
      },
    });
  });

  return connection;
};
