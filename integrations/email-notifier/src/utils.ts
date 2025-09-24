import {
  SESv2Client,
  CreateContactCommand,
  AlreadyExistsException,
} from "@aws-sdk/client-sesv2";
import * as bp from ".botpress";
import { getSesClient } from "./client";

const SESClient = getSesClient();

export const CONTACT_LIST = "default";

export async function addContactToList(email: string) {
  try {
    await SESClient.send(
      new CreateContactCommand({
        ContactListName: CONTACT_LIST,
        EmailAddress: email,
      }),
    );
  } catch (error) {
    console.log(`Failed to add ${email} to contact list: ${error}`);
  }
}