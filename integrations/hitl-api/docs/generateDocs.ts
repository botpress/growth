import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import swaggerJSDoc from "swagger-jsdoc";
import fs from "fs";
import {
  PingPayload,
  CreateRemoteConversationPayload,
  CloseRemoteTicketPayload,
  CreateRemoteUserPayload,
  BotSendsMessagePayload,
  AgentAssignedPayload,
  StopHitlPayload,
  CreateRemoteConversationResponse,
  CreateRemoteUserResponse,
  AgentMessagePayload,
} from "../src/types";

// Initialize the OpenAPI registry
const registry = new OpenAPIRegistry();

// Register payload schemas using the registry
registry.register("PingPayload", PingPayload);
registry.register(
  "CreateRemoteConversationPayload",
  CreateRemoteConversationPayload,
);
registry.register("CloseRemoteTicketPayload", CloseRemoteTicketPayload);
registry.register("CreateRemoteUserPayload", CreateRemoteUserPayload);
registry.register("BotSendsMessagePayload", BotSendsMessagePayload);
registry.register("AgentAssignedPayload", AgentAssignedPayload);
registry.register("StopHitlPayload", StopHitlPayload);
registry.register("AgentMessagePayload", AgentMessagePayload);

// Register response schemas using the registry
registry.register(
  "CreateRemoteConversationResponse",
  CreateRemoteConversationResponse,
);
registry.register("CreateRemoteUserResponse", CreateRemoteUserResponse);

// Generate the OpenAPI components from Zod schemas
const generator = new OpenApiGeneratorV3(registry.definitions);
const openApiComponents = generator.generateComponents();

// Swagger JSDoc options for Botpress Webhook API (handler.ts)
const swaggerOptionsBotpressWebhook = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Botpress HITL API - Call API",
      version: "1.0.0",
      description: "The Botpress HITL API to interact with conversations",
    },
    servers: [
      {
        url: "https://webhook.botpress.cloud/{webhookId}",
        variables: {
          webhookId: {
            default: "YOUR_WEBHOOK_ID",
            description:
              "The webhook id found in your bot's integration configuration page in the webhook url.",
          },
        },
      },
    ],
    components: openApiComponents.components, // Use the generated components from Zod
  },
  apis: ["./src/handler.ts"],
};

// Swagger JSDoc options for External Service API (externalService.ts)
const swaggerOptionsExternalService = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Botpress HITL API - Endpoints to implement",
      version: "1.0.0",
      description:
        "The API you need to implement on your end to receive HITL requests",
    },
    servers: [
      {
        url: "https://{yourServiceBaseUrl}",
        description: "External Service URL",
        variables: {
          yourServiceBaseUrl: {
            default: "YOUR_AGENT_SERVICE.com",
            description:
              "The domain of the external service that handles HITL requests",
          },
        },
      },
    ],
    components: openApiComponents.components, // Use the generated components from Zod
  },
  apis: ["./src/externalService.ts"],
};

// Generate Swagger specifications
const swaggerSpecBotpressWebhook = swaggerJSDoc(swaggerOptionsBotpressWebhook);
const swaggerSpecExternalService = swaggerJSDoc(swaggerOptionsExternalService);

// Write the Swagger specs to separate files
fs.writeFileSync(
  "./docs/output/openapi-botpress-webhook.json",
  JSON.stringify(swaggerSpecBotpressWebhook, null, 2),
);
fs.writeFileSync(
  "./docs/output/openapi-external-service.json",
  JSON.stringify(swaggerSpecExternalService, null, 2),
);

console.log(
  "OpenAPI JSON generated for Botpress Webhook at ./docs/output/openapi-botpress-webhook.json",
);
console.log(
  "OpenAPI JSON generated for External Service at ./docs/output/openapi-external-service.json",
);
