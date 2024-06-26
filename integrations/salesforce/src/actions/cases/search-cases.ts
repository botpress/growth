import { Output } from ".botpress/implementation/actions/searchCases/output";
import { SearchCasesResponse } from "src/misc/salesforce-types";
import { Implementation } from "src/misc/types";
import { getSearchCasesQuery } from "src/misc/utils/queryUtils";
import { getConnection } from "src/misc/utils/salesforceConnectionUtils";
import { handleError } from "src/misc/utils/errorUtils";

export const searchCases: Implementation["actions"]["searchCases"] = async ({
  client,
  ctx,
  input,
  logger,
}): Promise<Output> => {
  logger.forBot().info("Attempting to search contacts");

  const connection = await getConnection(client, ctx, logger);

  const searchQuery = getSearchCasesQuery(input);

  try {
    const response: SearchCasesResponse = await connection.query(searchQuery);

    logger.forBot().info(`Successfully found ${response.totalSize} records`);

    return { records: response.records };
  } catch (error) {
    return handleError("'Search Cases' error", error, logger);
  }
};
