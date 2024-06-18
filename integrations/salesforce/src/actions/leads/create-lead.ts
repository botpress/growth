import { Output } from ".botpress/implementation/actions/createLead/output";
import { Implementation } from "src/misc/types";
import { getConnection } from "src/misc/utils/salesforceConnectionUtils";
import { handleError } from "src/misc/utils/errorUtils";

export const createLead: Implementation["actions"]["createLead"] = async ({
  client,
  ctx,
  input,
  logger,
}): Promise<Output> => {
  logger.forBot().info("Attempting to create a lead");
  const errorMsg = "'Create Lead' error:";

  try {
    const connection = await getConnection(client, ctx, logger);
    const response = await connection.sobject("Lead").create(input);

    if (!response.success) {
      return handleError(errorMsg, response.errors, logger);
    }

    logger.forBot().info(`Successfully created lead with id ${response.id}`);
    return response;
  } catch (error) {
    return handleError(errorMsg, error, logger);
  }
};
