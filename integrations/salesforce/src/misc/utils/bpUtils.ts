import { Client } from "../types";
import * as sdk from "@botpress/sdk";

export const getSfCredentials = async (
  client: Client,
  integrationId: string,
) => {
  try {
    const {
      state: { payload },
    } = await client.getState({
      type: "integration",
      name: "credentials",
      id: integrationId,
    });

    return payload;
  } catch {
    throw new sdk.RuntimeError(
      "Salesforce credentials not found. Please log in to your Salesforce account to continue.",
    );
  }
};
