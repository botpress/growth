# Intercom HITL Integration

This integration allows Botpress to use Intercom as a HITL (Human in the Loop) provider. Messages from the bot will appear in Intercom, and agent responses will be sent back to the bot.

## Features

- Seamless integration between Botpress and Intercom
- Real-time message synchronization
- Support for text messages
- Automatic conversation session management
- Webhook-based event handling
- Agent assignment and conversation management

## Configuration

The integration requires the following configuration:

- `accessToken`: Your Intercom Access Token (required for API authentication)

## Intercom App Setup for Botpress Integration

This guide walks you through the setup and configuration of Intercom to enable integration with your Botpress chatbot.

### Step-by-Step Instructions

#### 1. Create an Intercom App

- Navigate to [https://app.intercom.com/](https://app.intercom.com/)
- Sign in to your Intercom account
- Go to **Apps** in the developer hub
- Click **"Create App"**
- Enter your app name (e.g., "Botpress HITL Integration")
- Click **"Create App"**

#### 2. Copy Access Token

- In your app dashboard, go to **Authentication**
- Copy the **Access Token** shown in the Access token section
- In your **Botpress Intercom integration config**, paste this Access Token

#### 3. Configure Webhooks

##### a. Conversation Events Webhook

- Go to **Webhooks** in your app dashboard
- Click **"Add Webhook"**
- Set the **Webhook URL** to your **Botpress Intercom integration webhook URL**
- **Subscribe to only these events:**
  - `conversation.admin.assigned`
  - `conversation.admin.closed`
  - `conversation.admin.replied`
- Click **"Save Webhook"**

### Summary of Required Botpress Config

- **Access Token**: From Intercom App Authentication
- **Webhook URL**: Provided by Botpress

## Usage

1. Configure the integration with your Intercom Access Token
2. Start a conversation session using the `startHitl` action
3. Messages from the bot will appear in Intercom conversations
4. Agent responses in Intercom will be sent back to the bot
5. Conversation state is automatically managed between Botpress and Intercom

> **Note:** When starting a HITL session, if the user's email does not exist as a contact in Intercom, a new contact will be created automatically. If the email already exists, the existing contact will be used for the HITL process.

## Support

For support, please contact the Botpress team or refer to the [Intercom API documentation](https://developers.intercom.com/docs).

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**: Ensure your webhook URL is publicly accessible and properly configured
2. **Authentication errors**: Verify your Access Token is correct and has the required permissions
3. **Messages not syncing**: Check that the conversation is properly created and the contact exists in Intercom

### Debug Mode

Enable debug logging in your Botpress configuration to troubleshoot integration issues.
