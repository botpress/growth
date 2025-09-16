import { isAxiosError } from "axios";
import { z } from "@botpress/sdk";

const formatZodErrors = (issues: z.ZodIssue[]) =>
  "Validation Error: " +
  issues
    .map((issue) => {
      const path = issue.path?.length ? `${issue.path.join(".")}: ` : "";
      return path ? `${path}${issue.message}` : issue.message;
    })
    .join("\n");

export const getErrorMessage = (err: unknown): string => {
  if (isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data;

    if (typeof data === "string" && data.trim()) {
      return status ? `${data} (Status: ${status})` : data;
    }
    return status ? `${err.message} (Status: ${status})` : err.message;
  }

  if (err instanceof z.ZodError) {
    return formatZodErrors(err.errors);
  }

  if (err instanceof Error) {
    return err.message;
  }

  if (typeof err === "string") {
    return err;
  }

  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }
  return "An unexpected error occurred";
};
