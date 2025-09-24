import * as bp from ".botpress";
import {
  addContactToList,
} from "../utils";
import {
  SendEmailCommand,
  MessageRejected,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServiceErrorException,
} from "@aws-sdk/client-sesv2";
import { sendResults } from "../definitions/types";
import * as sdk from "@botpress/sdk";
import { getSesClient } from "../misc/client";
import { CONTACT_LIST, FROM_EMAIL_ADDRESS } from "../misc/constants";
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
      } catch (error: any) {
        logger.forBot().error(
          `Raw error for ${email}:`,
          JSON.stringify(
            {
              name: error.name,
              message: error.message,
              code: error.code,
              statusCode: error.$metadata?.httpStatusCode,
              errorType: error.$fault,
              full: error,
            },
            null,
            2,
          ),
        );

        let reason = "Unknown error";
        if (
          error instanceof MessageRejected ||
          error.message?.includes("unsubscribed") ||
          error.message?.includes("suppressed")
        ) {
          reason =
            "Message rejected - recipient may have unsubscribed or email suppressed";
        } else if (error instanceof NotFoundException) {
          reason =
            "Resource not found (contact list or configuration may not exist)";
        } else if (error instanceof ConflictException) {
          reason = "Conflict with current state of resource";
        } else if (error instanceof InternalServiceErrorException) {
          reason = "Internal AWS service error";
        } else if (error instanceof BadRequestException) {
          reason = `Invalid request: ${error.message}`;
        } else if (error.code) {
          reason = `AWS Error (${error.code}): ${error.message}`;
        }

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";

        results.failed.push({
          email,
          error: errorMessage,
        });

        logger
          .forBot()
          .warn(
            `Failed to send email to ${email}: ${reason} - ${errorMessage}`,
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
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    logger.forBot().error(`Failed to send email: ${errorMessage}`);
    logger.forBot().error(JSON.stringify(error));

    throw new sdk.RuntimeError(`Failed to send email: ${errorMessage}`);
  }
};
