import { boolean, z } from "@botpress/sdk";
import { QueryResult } from "jsforce";
import { handleError } from "src/misc/utils/errorUtils";
import { Logger, SalesforceObject, Client, Context } from "src/misc/types";
import { getSearchQuery } from "src/misc/utils/queryUtils";
import { getConnection } from "src/misc/utils/salesforceConnectionUtils";
import { QueryOutput } from "src/misc/types";

export const fetchSalesforceObjects = async <T extends object>(
  objectType: SalesforceObject,
  props: { input: T; logger: Logger; client: Client; ctx: Context }
): Promise<QueryOutput> => {
  const { client, ctx, input, logger } = props;
  logger
    .forBot()
    .info(`Attempting to search ${objectType} from ${JSON.stringify(input)}`);
  const errorMsg = `'Search ${objectType}' error:`;

  try {
    const connection = await getConnection(client, ctx, logger);

    const searchQuery = getSearchQuery(objectType, input);

    const response = await connection.query(searchQuery);

    logger
      .forBot()
      .info(
        `Successfully searched ${objectType} from data ${JSON.stringify(input)}`
      );
    return { success: true, records: response.records };
  } catch (error) {
    return handleError(errorMsg, error, logger);
  }
};
