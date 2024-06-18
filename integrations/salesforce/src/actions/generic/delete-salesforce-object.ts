import { z } from "@botpress/sdk";
import { handleError } from "src/misc/utils/errorUtils";
import { Logger, SalesforceObject, Client, Context } from "src/misc/types";
import { getConnection } from "src/misc/utils/salesforceConnectionUtils";
import { RecordResultSchema } from "src/misc/custom-schemas/common-schemas";

export const deleteSalesforceObject = async <T extends { id: string }>(
  objectType: SalesforceObject,
  props: { input: T; logger: Logger; client: Client; ctx: Context }
): Promise<z.infer<typeof RecordResultSchema>> => {
  const { client, ctx, input, logger } = props;
  logger
    .forBot()
    .info(
      `Attempting to delete a ${objectType} from from ${JSON.stringify(input)}`
    );
  const errorMsg = `'Delete ${objectType}' error:`;

  try {
    const connection = await getConnection(client, ctx, logger);
    const response = await connection.sobject(objectType).destroy(input.id);

    if (!response.success) {
      return handleError(errorMsg, response.errors, logger);
    }

    logger
      .forBot()
      .info(`Successfully deleted ${objectType} with id ${response.id}`);
    return response;
  } catch (error) {
    return handleError(errorMsg, error, logger);
  }
};
