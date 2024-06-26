import { Output } from ".botpress/implementation/actions/createCase/output";
import { Implementation } from "src/misc/types";
import { getConnection } from "src/misc/utils/salesforceConnectionUtils";
import { handleError } from "src/misc/utils/errorUtils";

export const createCase: Implementation["actions"]["createCase"] = async ({
  client,
  ctx,
  input,
  logger,
}): Promise<Output> => {
  logger.forBot().info("Attempting to create a case");
  const errorMsg = "'Create Case' error:";

  try {
    const connection = await getConnection(client, ctx, logger);
    const response = await connection.sobject("Case").create(input);

    if (!response.success) {
      return handleError(errorMsg, response.errors, logger);
    }

    logger.forBot().info(`Successfully created case with id ${response.id}`);
    return response;
  } catch (error) {
    return handleError(errorMsg, error, logger);
  }
};
