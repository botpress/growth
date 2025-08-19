import * as bp from "@botpress/sdk";
import { Connection } from "jsforce";
import querystring from "querystring";
import { getSuccessLoginPage } from "src/misc/get-success-login-page";
import { HandlerProps } from "src/misc/types";
import { getOAuth2 } from "src/misc/utils/sfUtils";

export const rootHandler = async (props: HandlerProps) => {
  const { req, ctx, client, logger } = props;
  const log = logger.forBot();
  log.info("Handling request...");

  const needsToLoginSalesforce =
    (req.path === "/" || req.path === "") && req.method === "GET";

  if (needsToLoginSalesforce) {
    const oAUth2 = getOAuth2(ctx);

    const authorizationUrl = `${oAUth2.getAuthorizationUrl({})}&state=${
      ctx.webhookId
    }`;

    log.info("Redirecting to Salesforce login page");

    return {
      status: 302,
      headers: {
        Location: authorizationUrl,
      },
      body: "",
    };
  }

  const { code } = querystring.parse(req.query);

  const salesforceConnection = new Connection({ oauth2: getOAuth2(ctx) });

  if (typeof code !== "string") {
    throw new bp.RuntimeError("Incorrect code provided");
  }

  await salesforceConnection.authorize(code);

  const { accessToken, instanceUrl, refreshToken } = salesforceConnection;

  if (!refreshToken) {
    throw new Error("No refresh token provided");
  }

  await client.setState({
    type: "integration",
    name: "credentials",
    id: ctx.integrationId,
    payload: {
      isSandbox: ctx.configuration.sandboxEnvironment,
      accessToken,
      instanceUrl,
      refreshToken,
    },
  });

  return {
    status: 200,
    headers: { "Content-Type": "text/html" },
    body: getSuccessLoginPage(ctx.botId),
  };
};
