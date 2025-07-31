import { z } from "@botpress/sdk";
import { handleError } from "src/misc/utils/errorUtils";
import { Logger, SalesforceObject, Client, Context } from "src/misc/types";
import { getConnection, getRequestPayload } from "src/misc/utils/sfUtils";
import { RecordResultSchema } from "src/misc/custom-schemas/common-schemas";

export const updateSalesforceRecord = async <
  T extends { customFields?: string },
>(
  objectType: SalesforceObject,
  props: { input: T; logger: Logger; client: Client; ctx: Context },
): Promise<z.infer<typeof RecordResultSchema>> => {
  const { client, ctx, input, logger } = props;

  const errorMsg = `'Update ${objectType}' error:`;

  try {
    const payload = getRequestPayload(input);

    logger
      .forBot()
      .info(
        `Attempting to update a ${objectType} from ${JSON.stringify(payload)}`,
      );

    const connection = await getConnection(client, ctx, logger);
    const response = await connection.sobject(objectType).update(payload);

    if (!response.success) {
      return handleError(errorMsg, response.errors, logger);
    }

    logger
      .forBot()
      .info(`Successfully updated contact with data ${JSON.stringify(input)}`);
    return response;
  } catch (error) {
    return handleError(errorMsg, error, logger);
  }
};
