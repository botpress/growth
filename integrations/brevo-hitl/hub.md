# Botpress-Brevo HITL Integration

This integration allows you to connect your Botpress bot with Brevo's conversations platform, enabling a Human-in-the-Loop (HITL) setup. This means your Botpress bot can handle initial user interactions and seamlessly escalate conversations to human agents in Brevo when necessary.

## How it Works

When a user interacts with your Botpress bot, the conversation can be transferred to a human agent in Brevo. The agent can then take over the conversation and provide personalized support. Messages from the Botpress user will be relayed to the Brevo agent, and vice-versa.

## Key Limitations

Please be aware of the following limitations when using this integration:

- **Message Attribution:** Messages sent by the Botpress user to the Brevo agent will appear as if they are being sent by the Brevo agent account that is configured with the integration. However, to distinguish these messages, they will be prepended with "Botpress User:". For example: `Botpress User: Hello, I need help with my order.`
- **Status Updates:** The Botpress user will not automatically receive notifications or status updates regarding agent assignment (e.g., "Agent John has joined the chat").

## Setup Guide

To configure the Botpress-Brevo HITL integration, you will need the following:

1.  **Brevo API Key:**
    - You can create and manage your Brevo API keys by following the instructions on their official help page: [Create and manage your API keys](https://help.brevo.com/hc/en-us/articles/209467485-Create-and-manage-your-API-keys)
2.  **Deactivate IP Blocking:**
    - For seamless communication between Botpress and Brevo, it's necessary to deactivate IP blocking in your Brevo account.
    - Navigate to [Brevo IP Authorisation](https://app.brevo.com/security/authorised_ips) and ensure that IP blocking is deactivated to allow requests from your Botpress environment.
3.  **Brevo Agent ID:**
    - You need to specify which Brevo agent account will be used by the integration to send and receive messages.
    - Navigate to the Brevo agents settings page: [Brevo Agents Settings](https://conversations-app.brevo.com/settings/agents)
    - Identify the agent you wish to use for the integration and copy their Agent ID.

## Webhook Setup (Required)

To receive events from Brevo in your Botpress integration, you must set up a webhook in Brevo:

1. Go to **Integrations > Webhooks** in your Brevo dashboard ([direct link](https://conversations-app.brevo.com/settings/integrations/webhooks)).
2. Click **Add new webhook** (or edit an existing one).
3. In the **URL** field, enter your Botpress Brevo integration webhook endpoint. Example:
   ```
   https://webhook.botpress.cloud/ff43meb9-a102-4201-b045-fc498dc1f52b
   ```
4. Under **Event types**, select:
   - `conversationStarted`
   - `conversationTranscript`
   - `conversationFragment`
5. Click **Save** to activate the webhook.

> **Note:** Make sure the URL matches your Botpress integration's endpoint and that all required event types are checked for full functionality.

Once this is set up, your Botpress integration will receive real-time events from Brevo and can process them accordingly.

Once you have these details, you can proceed with configuring the integration within your Botpress environment according to the integration's specific setup instructions.
