
# HubSpot Inbox Custom Channels HITL (Human-in-the-Loop) Integration

This integration enables Botpress to escalate conversations from a chatbot to a live agent in a HubSpot Inbox via Custom Channels. It uses the HubSpot Inbox Custom Channels API to create, send, and manage HITL (Human-in-the-Loop) conversations and agent interactions.

## Note: This integration requires one of the following products or higher.
HubSpot Sales Hub - Professional

HubSpot Service Hub - Professional

### Escalate to Human - Phone Number Requirement

To successfully trigger HITL's **"Escalate to a Human"** card, you must pass a **valid phone number including the country code** into the **"User Email"** field.

> ⚠️ This phone number **must match** the number of an existing contact in HubSpot. If there’s no match, the escalation will not work.

## How It Works

### Conversation Start

- When a user requests live agent support, the bot:
  - Calls HubSpot Inbox's Custom Channels API to start a new conversation thread.
  - Registers the custom channel and sends the initial "Name, title, description" message.

### Message Handling

- All subsequent user messages are:
  - Sent to HubSpot Inbox as INCOMING messages through the Custom Channels API.
  - Routed to the appropriate inbox and agent in the HubSpot Inbox Conversations UI.

### Operator Events Tracking

The integration listens for HubSpot Inbox webhook events, including:
- `operatorAssignedUpdate`: Fires when an agent joins the thread.
- `operatorSendMessage`: Captures replies sent by the agent.
- `operatorConversationCompleted`: Fires when the conversation is closed by the agent.

These events are handled in the `src/events/` directory and forwarded to Botpress via custom events like `hitlAssigned` and `hitlStopped`.

### Closing Conversations

- When an agent marks a conversation as complete, Botpress:
  - Recognizes the event via webhook.
  - Terminates the HITL session and notifies the bot.

## HubSpot Inbox HITL Integration Setup Guide

This guide walks you through connecting your HubSpot Inbox with Botpress using OAuth for Human-in-the-Loop functionality.

### **[Loom video walk through setting up the OAuth configuration.](https://www.loom.com/share/4f1671cfd4fd4063b5e8570830100a44?sid=a22987f8-858b-4ef2-a879-ccac762fb6aa)** ###


### 1. Create a HubSpot Developer Account
- Go to [HubSpot Developer](https://developers.hubspot.com/) and sign up or log in.

### 2. Create a Public App
- Navigate to **Apps** > **Create app**
- Set the **Redirect URL** to your Botpress webhook URL  
  Example: `https://your-botpress-url.com/api/v1/webhooks/hubspot`

### 3. Generate Your Developer API Key
- In your developer portal, go to **Keys**
- Generate a `developer_api_key`

### 4. Configure Your App Credentials in Botpress
In your Botpress integration config, paste the following values:
- `developer_api_key`
- `app ID`
- `client ID`
- `client secret`

### 5. Retrieve Your Inbox ID
- In HubSpot, go to:  
  **CRM** → **Inbox** → **Inbox Settings**
- Copy your Inbox ID from the URL:  
  Example:  
  `https://app-na3.hubspot.com/live-messages-settings/341662569/inboxes/1263703960/channels`  
  Here, the **Inbox ID** is: `1263703960`
- Paste this Inbox ID into your Botpress integration config.

### 6. Set App Scopes and Webhook
- In your public app settings, set the **Scopes** to:
  ```
  conversations.custom_channels.read
  conversations.custom_channels.write
  conversations.read
  conversations.visitor_identification.tokens.create
  conversations.write
  crm.objects.contacts.read
  ```
- Under **Webhooks**, set the **Target URL** to your Botpress webhook URL.

### 7. Subscribe to Webhook Events
Create webhook subscriptions for the following events:
- `conversations.newMessage`
- `conversation.propertyChange` (AssignedTo, Status)

---

## Get Your OAuth Refresh Token

### 1. Get the Authorization Code
Open the following URL in your browser (replace values accordingly):
```bash
https://app.hubspot.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=conversations.custom_channels.read%20conversations.custom_channels.write%20conversations.read%20conversations.visitor_identification.tokens.create%20conversations.write%20crm.objects.contacts.read&response_type=code
```

### 2. Exchange the Code for Tokens
Use the following cURL request to get your tokens:
```bash
curl -X POST https://api.hubapi.com/oauth/v1/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "redirect_uri=YOUR_BOTPRESS_WEBHOOK_URL" \
  -d "code=YOUR_AUTHORIZATION_CODE"
```

You’ll receive:
- `access_token`
- `refresh_token`
- `expires_in`

Save your `refresh_token` in your Botpress integration settings.

> ⚠️ **Note:** After saving your final integration configuration in Botpress, it may take **over a minute** for the HubSpot channel to connect. **Do not refresh or close the page** during this time.

---

## You're All Set!
Your HubSpot inbox is now connected to Botpress HITL via OAuth. You should now be able to receive and respond to conversations within Botpress.
