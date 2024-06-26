import { Output } from ".botpress/implementation/actions/updateLead/output";
import { Implementation } from "src/misc/types";
import { getConnection } from "src/misc/utils/salesforceConnectionUtils";
import { handleError } from "src/misc/utils/errorUtils";

export const updateLead: Implementation["actions"]["updateLead"] = async ({
  client,
  ctx,
  input,
  logger,
}): Promise<Output> => {
  logger.forBot().info("Attempting to update a lead");
  const errorMsg = "'Update Lead' error:";

  try {
    const connection = await getConnection(client, ctx, logger);
    const response = await connection.sobject("Lead").update(input);

    if (!response.success) {
      return handleError(errorMsg, response.errors, logger);
    }

    logger.forBot().info(`Successfully updated lead with id ${response.id}`);
    return response;
  } catch (error) {
    return handleError(errorMsg, error, logger);
  }
};
