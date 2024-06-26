import { Output } from ".botpress/implementation/actions/searchLeads/output";
import { SearchLeadsResponse } from "src/misc/salesforce-types";
import { Implementation } from "src/misc/types";
import { getSearchLeadsQuery } from "src/misc/utils/queryUtils";
import { getConnection } from "src/misc/utils/salesforceConnectionUtils";
import { handleError } from "src/misc/utils/errorUtils";

export const searchLeads: Implementation["actions"]["searchLeads"] = async ({
  client,
  ctx,
  input,
  logger,
}): Promise<Output> => {
  logger.forBot().info("Attempting to search leads");

  const connection = await getConnection(client, ctx, logger);

  const searchQuery = getSearchLeadsQuery(input);

  try {
    const response: SearchLeadsResponse = await connection.query(searchQuery);

    logger.forBot().info(`Successfully found ${response.totalSize} records`);

    return { records: response.records };
  } catch (error) {
    return handleError("'Search Leads' error", error, logger);
  }
};
