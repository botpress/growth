import * as bp from "@botpress/sdk";
import { Logger } from "src/misc/types";

export const handleError = (
  errorMsg: string,
  error: any,
  logger: Logger
): never => {
  const fullErrorMsg = `${errorMsg} ${JSON.stringify(error)}`;
  logger.forBot().error(fullErrorMsg);
  throw new bp.RuntimeError(fullErrorMsg);
};
