import { Output } from ".botpress/implementation/actions/deleteLeads/output";
import { Implementation } from "src/misc/types";
import { getConnection } from "src/misc/utils/salesforceConnectionUtils";
import { handleError } from "src/misc/utils/errorUtils";

export const deleteLeads: Implementation["actions"]["deleteLeads"] = async ({
  client,
  ctx,
  input,
  logger,
}): Promise<Output> => {
  logger.forBot().info("Attempting to delete leads");
  const errorMsg = "'Delete Lead' error:";

  try {
    const connection = await getConnection(client, ctx, logger);
    const idsToDelete = input.ids.split(",").map((id) => id.trim());
    const results = await connection.sobject("Lead").del(idsToDelete);

    logger.forBot().info(`Successfully deleted leads with ids ${input.ids}`);
    return { results };
  } catch (error) {
    return handleError(errorMsg, error, logger);
  }
};
