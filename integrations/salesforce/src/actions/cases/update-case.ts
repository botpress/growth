import { Output } from ".botpress/implementation/actions/updateCase/output";
import { Implementation } from "src/misc/types";
import { getConnection } from "src/misc/utils/salesforceConnectionUtils";
import { handleError } from "src/misc/utils/errorUtils";

export const updateCase: Implementation["actions"]["updateCase"] = async ({
  client,
  ctx,
  input,
  logger,
}): Promise<Output> => {
  logger.forBot().info("Attempting to update a contact");
  const errorMsg = "'Update Case Error:'";

  try {
    const connection = await getConnection(client, ctx, logger);
    const response = await connection.sobject("Case").update(input);

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
