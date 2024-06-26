import { contactActionDefinitions } from "./contact-actions";
import { leadActionDefinitions } from "./lead-actions";
import { caseActionDefinitions } from "./case-actions";

export const actionDefinitions = {
  ...contactActionDefinitions,
  ...leadActionDefinitions,
  ...caseActionDefinitions,
};
