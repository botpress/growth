import { z } from "@botpress/sdk";
import { MakeApiRequestInputSchema } from "src/misc/custom-schemas/api-schemas";
import { MakeApiRequestUi } from "src/misc/custom-uis/api-uis";

const makeApiRequest = {
  title: "Make API Request",
  description: "Make a request to Salesforce API",
  input: {
    schema: MakeApiRequestInputSchema,
    ui: MakeApiRequestUi,
  },
  output: {
    schema: z.object({}).passthrough(),
  },
};

export const apiActionDefinitions = {
  makeApiRequest,
};
