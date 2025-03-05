import { Logger } from "src/misc/types";
import { isAxiosError } from "axios";

export const handleError = (errorMsg: string, error: any, logger: Logger) => {
  let fullErrorMsg = `${errorMsg} ${
    error?.errorCode || error?.message || "Error"
  }`;

  if(isAxiosError(error) && error.response?.data) {
    fullErrorMsg += ` -> ${JSON.stringify(error.response.data)}`
  }

  logger.forBot().error(fullErrorMsg);
  logger.forBot().error(JSON.stringify(error));

  return {
    success: false,
    error: fullErrorMsg,
  } as const;
};
