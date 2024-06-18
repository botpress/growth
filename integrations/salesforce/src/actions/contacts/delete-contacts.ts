import { Output } from ".botpress/implementation/actions/deleteContacts/output";
import { Implementation } from "src/misc/types";
import { getConnection } from "src/misc/utils/salesforceConnectionUtils";
import { handleError } from "src/misc/utils/errorUtils";

export const deleteContacts: Implementation["actions"]["deleteContacts"] =
  async ({ client, ctx, input, logger }): Promise<Output> => {
    logger.forBot().info("Attempting to delete contacts");

    const idsToDelete = input.ids.split(",").map((id) => id.trim());

    try {
      const connection = await getConnection(client, ctx, logger);
      const results = await connection.sobject("Contact").del(idsToDelete);

      logger
        .forBot()
        .info(`Successfully deleted contacts with ids: ${input.ids}`);
      return { results: results } as Output;
    } catch (error) {
      return handleError("'Delete Contacts' error:", error, logger);
    }
  };
