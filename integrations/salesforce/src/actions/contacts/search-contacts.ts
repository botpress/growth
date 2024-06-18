import * as bp from "@botpress/sdk";
import { Output } from ".botpress/implementation/actions/searchContacts/output";
import { SearchContactsResponse } from "src/misc/salesforce-types";
import { Implementation } from "src/misc/types";
import { getSearchContactsQuery } from "src/misc/utils/queryUtils";
import { getConnection } from "src/misc/utils/salesforceConnectionUtils";
import { handleError } from "src/misc/utils/errorUtils";

export const searchContacts: Implementation["actions"]["searchContacts"] =
  async ({ client, ctx, input, logger }): Promise<Output> => {
    logger.forBot().info("Attempting to search contacts");

    const connection = await getConnection(client, ctx, logger);

    const searchQuery = getSearchContactsQuery(input);

    try {
      const response: SearchContactsResponse = await connection.query(
        searchQuery
      );

      logger.forBot().info(`Successfully found ${response.totalSize} records`);

      return { records: response.records };
    } catch (error) {
      return handleError("'Search Contacts' error", error, logger);
    }
  };
