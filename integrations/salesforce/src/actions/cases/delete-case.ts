import { Output } from ".botpress/implementation/actions/deleteCase/output";
import { Implementation } from "src/misc/types";
import { getConnection } from "src/misc/utils/salesforceConnectionUtils";
import { handleError } from "src/misc/utils/errorUtils";

export const deleteCase: Implementation["actions"]["deleteCase"] = async ({
  client,
  ctx,
  input,
  logger,
}): Promise<Output> => {
  logger.forBot().info("Attempting to delete case");

  const errorMsg = "'Delete Case' error:";

  try {
    const connection = await getConnection(client, ctx, logger);
    const result = await connection.sobject("Case").destroy(input.caseId);

    if (!result.success) {
      return handleError(errorMsg, result.errors, logger);
    }

    logger.forBot().info(`Successfully deleted case: ${input.caseId}`);
    return result;
  } catch (error) {
    return handleError(errorMsg, error, logger);
  }
};
