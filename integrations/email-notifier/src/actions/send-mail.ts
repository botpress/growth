import * as bp from ".botpress";
import {
  addContactToList,
} from "../utils";
import {
  SendEmailCommand,
} from "@aws-sdk/client-sesv2";
import { sendResults } from "../definitions/types";
import * as sdk from "@botpress/sdk";
import { getSesClient } from "../misc/client";
import { CONTACT_LIST, FROM_EMAIL_ADDRESS } from "../misc/constants";
import { getErrorMessage } from "../misc/error-handler";

export const sendMail: bp.IntegrationProps["actions"]["sendMail"] = async ({
  input,
  logger,
  client,
  ctx,
}) => {
  try {
    const SESClient = getSesClient();

    const header = "This is a notification from your Botpress bot.";
    const updateLinkUrl = `https://studio.botpress.cloud/${ctx.botId}`;
    const htmlBody = `<div>
    <p>${header}</p>
    ${input.body ? `<p>${input.body}</p>` : ""}
    <p><a href="${updateLinkUrl}">Update the notification here</a></p>
    <p><a href="{{amazonSESUnsubscribeUrl}}">Unsubscribe</a></p>
    </div>`;

    const results:sendResults = {
      successful: [],
      failed: [],
    };

    for (const email of input.to) {
      try {
          await addContactToList(email);

        const sendEmailCommand = new SendEmailCommand({
          Destination: {
            ToAddresses: [email], // An unsubscribed email will fail entire operation so emails must be sent individually.
          },
          Content: {
            Simple: {
              Subject: {
                Data: input.subject,
                Charset: "UTF-8",
              },
              Body: {
                Html: {
                  Data: htmlBody,
                  Charset: "UTF-8",
                },
              },
            },
          },
          ListManagementOptions: {
            ContactListName: CONTACT_LIST,
          },
          FromEmailAddress: FROM_EMAIL_ADDRESS,
        });

        const result = await SESClient.send(sendEmailCommand);

        if (!result.MessageId) {
          throw new sdk.RuntimeError(`Failed to send email to ${email}`);
        }

        results.successful.push({
          email,
          messageId: result.MessageId,
        });

        logger
          .forBot()
          .info(
            `Email sent successfully to ${email}. Message ID: ${result.MessageId}`,
          );

        await client.createEvent({
          type: "emailSent",
          payload: {
            messageId: result.MessageId!,
            to: [email],
            subject: input.subject,
            fromEmail: FROM_EMAIL_ADDRESS,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        results.failed.push({
          email,
          error: getErrorMessage(error),
        });

        logger
          .forBot()
          .warn(
            `Failed to send email to ${email}: ${getErrorMessage(error)}`,
          );
      }
    }

    logger
      .forBot()
      .info(
        `Email sending completed. Successful: ${results.successful.length}, Failed: ${results.failed.length}`,
      );

    return results;

  } catch (error) {
    logger.forBot().error(`Failed to send email: ${getErrorMessage(error)}`);
    throw new sdk.RuntimeError(`Failed to send email: ${getErrorMessage(error)}`);
  }
};
