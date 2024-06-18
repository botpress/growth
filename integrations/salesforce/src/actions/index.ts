import * as bp from ".botpress";
import CaseActions from "./cases";
import ContactActions from "./contacts";
import LeadActions from "./leads";

export const actions = {
  ...CaseActions,
  ...ContactActions,
  ...LeadActions,
} satisfies bp.IntegrationProps["actions"];
