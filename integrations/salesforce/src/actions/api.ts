import { isAxiosError } from "axios";
import { Output } from ".botpress/implementation/actions/makeApiRequest/output";
import { Action } from "src/misc/types";
import { makeRequest } from "src/misc/utils/apiUtils";
import { getSfCredentials } from "src/misc/utils/bpUtils";
import { refreshSfToken } from "src/misc/utils/sfUtils";
import { handleError } from "src/misc/utils/errorUtils";

export const makeApiRequest: Action["makeApiRequest"] = async (
  props
): Promise<Output> => {
  const { input, client, ctx, logger } = props;

  const sfCredentials = await getSfCredentials(client, ctx.integrationId);

  const url = `${sfCredentials.instanceUrl}/services/data/v54.0/${input.path}`;

  try {
    const res = await makeRequest(url, input, sfCredentials.accessToken);

    return {
      success: true,
      status: res.status,
      body: res.data,
    };
  } catch (e) {
    const errorMsg = `'Make API request' error:`;
    if (isAxiosError(e) && e.response?.status === 401) {
      try {
        await refreshSfToken(client, ctx);

        const newSfCredentials = await getSfCredentials(
          client,
          ctx.integrationId
        );

        logger.forBot().info("Refreshed token");

        const res = await makeRequest(url, input, newSfCredentials.accessToken);

        return {
          success: true,
          body: res.data,
        };
      } catch (e) {
        return handleError(errorMsg, e, logger);
      }
    }

    return handleError(errorMsg, e, logger);
  }
};
export const ApiActions = {
  makeApiRequest,
};
