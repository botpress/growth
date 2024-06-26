import { Output } from ".botpress/implementation/actions/createContact/output";
import { Implementation } from "src/misc/types";
import { getConnection } from "src/misc/utils/salesforceConnectionUtils";
import { handleError } from "src/misc/utils/errorUtils";

export const createContact: Implementation["actions"]["createContact"] =
  async ({ client, ctx, input, logger }): Promise<Output> => {
    logger.forBot().info("Attempting to create a contact");
    const errorMsg = "'Create Contact' error:";

    try {
      const connection = await getConnection(client, ctx, logger);
      const response = await connection.sobject("Contact").create(input);

      if (!response.success) {
        return handleError(errorMsg, response.errors, logger);
      }

      logger
        .forBot()
        .info(`Successfully created contact with id ${response.id}`);
      return response;
    } catch (error) {
      return handleError(errorMsg, error, logger);
    }
  };
