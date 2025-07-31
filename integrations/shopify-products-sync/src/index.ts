import actions from "./actions";
import * as bp from ".botpress";
import { register } from "./setup/register";
import { unregister } from "./setup/unregister";
import { handler } from "./setup/handler";

export default new bp.Integration({
  register,
  unregister,
  actions,
  channels: {},
  handler,
});
