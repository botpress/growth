import { z } from "@botpress/sdk";
import { handleError } from "src/misc/utils/errorUtils";
import { Logger, SalesforceObject, Client, Context } from "src/misc/types";
import { getConnection, getRequestPayload } from "src/misc/utils/sfUtils";
import { RecordResultSchema } from "src/misc/custom-schemas/common-schemas";

export const createSalesforceRecord = async <
  T extends { customFields?: string },
>(
  objectType: SalesforceObject,
  props: { input: T; logger: Logger; client: Client; ctx: Context },
): Promise<z.infer<typeof RecordResultSchema>> => {
  const { client, ctx, input, logger } = props;

  const errorMsg = `'Create ${objectType}' error:`;

  try {
    const payload = getRequestPayload(input);

    logger
      .forBot()
      .info(
        `Attempting to create a ${objectType} from from ${JSON.stringify(
          payload,
        )}`,
      );

    const connection = await getConnection(client, ctx, logger);
    const response = await connection.sobject(objectType).create(payload);

    if (!response.success) {
      return handleError(errorMsg, response.errors, logger);
    }

    logger
      .forBot()
      .info(`Successfully created ${objectType} with id ${response.id}`);
    return response;
  } catch (error) {
    return handleError(errorMsg, error, logger);
  }
};
