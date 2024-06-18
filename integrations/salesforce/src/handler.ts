import * as bp from "@botpress/sdk";
import { Connection } from "jsforce";
import querystring from "querystring";
import { getSuccessLoginPage } from "./misc/get-success-login-page";
import { HandlerProps } from "./misc/types";
import { getOAuth2 } from "./misc/utils/salesforceConnectionUtils";

export const handler = async ({ req, ctx, client, logger }: HandlerProps) => {
  const log = logger.forBot();
  log.info("Handling request...");

  const needsToLoginSalesforce =
    (req.path === "/" || req.path === "") && req.method === "GET";
  console.log(needsToLoginSalesforce, "need");
  if (needsToLoginSalesforce) {
    const oAUth2 = getOAuth2();
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

  const salesforceConnection = new Connection({ oauth2: getOAuth2() });

  if (typeof code !== "string") {
    throw new bp.RuntimeError("Incorreact code provided");
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
