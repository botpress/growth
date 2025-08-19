import type { UnregisterFunction } from "../misc/types";

export const unregister: UnregisterFunction = async ({ logger }) => {
  logger
    .forBot()
    .info(
      "Unregister process for LiveChat HITL integration invoked. No resources to clean up.",
    );
};
