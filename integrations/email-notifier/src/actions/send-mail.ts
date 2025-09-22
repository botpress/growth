import * as bp from ".botpress";
import {
  CONTACT_LIST,
  addContactToList,
  validateSendEmailInput,
} from "../utils";
import {
  SendEmailCommand,
  MessageRejected,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServiceErrorException,
} from "@aws-sdk/client-sesv2";
import * as sdk from "@botpress/sdk";
import { getSesClient } from "../client";

export const sendMail: bp.IntegrationProps["actions"]["sendMail"] = async ({
  input,
  logger,
  client,
  ctx,
}) => {
  const validation = validateSendEmailInput(input);
  if (!validation.isValid) {
    const errorMessage = `Invalid input: ${validation.errors.join(", ")}`;
    logger.forBot().error(errorMessage);
    throw new sdk.RuntimeError(errorMessage);
  }

  try {
    //initialize aws ses client
    const SESClient = getSesClient();

    const header = "This is a notification from your Botpress bot.";
    const textBodyCore = input.body || "";
    const updateLinkUrl = `https://studio.botpress.cloud/${ctx.botId}`;
    const htmlBody = `<div><p>${header}</p>${textBodyCore ? `<p>${textBodyCore}</p>` : ""}<p><a href=\"${updateLinkUrl}\">Update the notification here</a></p><p><a href=\"{{amazonSESUnsubscribeUrl}}\">Unsubscribe</a></p></div>`;
    logger.forBot().info(`Sending email to: ${input.to.join(", ")}`);
    logger.forBot().debug(`Email subject: ${input.subject}`);

    const results = {
      successful: [] as Array<{ email: string; messageId: string }>,
      failed: [] as Array<{ email: string; error: string; reason: string }>,
      messageIds: [] as string[],
    };

    for (const email of input.to) {
      try {
        // Add to contact list
        try {
          await addContactToList(email);
          logger.forBot().debug(`Added ${email} to contact list`);
        } catch (contactError) {
          logger
            .forBot()
            .warn(`Failed to add ${email} to contact list: ${contactError}`);
        }

        const sendEmailCommand = new SendEmailCommand({
          Destination: {
            ToAddresses: [email],
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
          FromEmailAddress: "noreply@bp-mailer.com",
        });

        const result = await SESClient.send(sendEmailCommand);

        results.successful.push({
          email,
          messageId: result.MessageId!,
        });
        results.messageIds.push(result.MessageId!);

        logger
          .forBot()
          .info(
            `Email sent successfully to ${email}. Message ID: ${result.MessageId}`,
          );

        // trigger event for successful email sending
        await client.createEvent({
          type: "emailSent",
          payload: {
            messageId: result.MessageId!,
            to: [email],
            subject: input.subject,
            fromEmail: "noreply@bp-mailer.com",
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
          reason,
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

    if (results.successful.length === 0) {
      const failureReasons = results.failed
        .map((f) => `${f.email}: ${f.reason}`)
        .join(", ");
      throw new sdk.RuntimeError(
        `Failed to send email to any recipients. Reasons: ${failureReasons}`,
      );
    }

    const message =
      results.failed.length > 0
        ? `Email sent to ${results.successful.length} recipient(s). ${results.failed.length} failed: ${results.failed.map((f) => `${f.email} (${f.reason})`).join(", ")}`
        : `Email sent successfully to all ${results.successful.length} recipient(s)`;

    return {
      success: true,
      messageIds: results.messageIds,
      message,
      details: {
        successful: results.successful,
        failed: results.failed,
        totalSent: results.successful.length,
        totalFailed: results.failed.length,
      },
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    logger.forBot().error(`Failed to send email: ${errorMessage}`);
    logger.forBot().error(JSON.stringify(error));

    throw new sdk.RuntimeError(`Failed to send email: ${errorMessage}`);
  }
};
