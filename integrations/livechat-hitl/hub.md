# LiveChat HITL Integration

This integration allows Botpress to use LiveChat as a HITL (Human in the Loop) provider. Messages from the bot will appear in LiveChat, and agent responses will be sent back to the bot.

## Features

- Seamless integration between Botpress and LiveChat
- Real-time message synchronization
- Support for text messages
- Automatic chat session management
- Webhook-based event handling
- Group-based routing for HITL conversations

## Configuration

The integration requires the following configuration:

- `clientId`: Your LiveChat client ID
- `organizationId`: Your LiveChat organization ID
- `webhookSecret`: Secret key for webhook verification
- `agentToken`: Your LiveChat personal agent token (Base64 encoded)
- `groupId`: LiveChat Group ID for routing HITL conversations

## LiveChat App Setup for Botpress Integration

This guide walks you through the creation and configuration of a LiveChat app via [platform.text.com](https://platform.text.com) to enable integration with your Botpress chatbot.

> 📹 **Video Guide**: Watch our step-by-step setup guide on [Loom](https://www.loom.com/share/c291c86a10e3496791dd32f6c0b0c64c?sid=84100a6a-b699-4363-89f2-194458c4a8ad)

### Step-by-Step Instructions

#### 1. Create a New App

- Navigate to [https://platform.text.com/console/apps](https://platform.text.com/console/apps)
- Click **"Build App"**
- Enter your app name
- Ensure **Livechat** is selected as the product
- Click **"Create App"**

#### 2. Add the App Authorization Block

- Go to **Blocks**
- Click **"Add Building Block"**
- Choose **App Authorization → Server-side App**
- Copy the **Client ID**
- In your **Botpress LiveChat integration config**, paste this Client ID
- Add the following scope:

  ```
  chats.conversation--all:rw
  ```

- **Important:** Add your **Botpress webhook URL** to the **Redirect URIs** field in this block

#### 3. Add Your Organization ID

- Go to [https://platform.text.com/console/settings/account](https://platform.text.com/console/settings/account)
- Copy your **Organization ID**
- Paste it into your **Botpress LiveChat integration config**

#### 4. Get Your Personal Agent Token

- Navigate to [https://platform.text.com/console/settings/authorization/personal-access-tokens](https://platform.text.com/console/settings/authorization/personal-access-tokens)
- Click **"Create Token"**
- Give your token a descriptive name (e.g., "Botpress HITL Integration")
- Select the following scopes:
  - `chats--access:rw`
- Click **"Create Token"**
- **Important:** Copy the Base64 encoded token immediately as it won't be shown again
- In your **Botpress LiveChat integration config**, paste this Base64 encoded token in the `agentToken` field

#### 5. Configure Group Routing

- In LiveChat, go to **Settings → Groups**
- Create a new group specifically for HITL conversations or note the ID of an existing group
- Copy the **Group ID** (this will be a number)
- In your **Botpress LiveChat integration config**, paste this Group ID in the `groupId` field
- **Note:** All HITL conversations will be routed to this group
- **Important:** By default, the initial agent assignment will be the agent that created the chat, so that agent must be in the specified group. Additionally, there need to be other available agents in the group besides the initial agent for the assignment to work properly. If necessary, you can set primary/backup agents in the group configuration.

#### 6. Configure Webhooks

##### a. Incoming Event Webhook

- In the **Blocks** section, add a **Chat Webhooks** block
- Set the **Webhook URL** to your **Botpress LiveChat integration webhook URL**
- **Generate a secret key** and use the same key in your Botpress config
- Set the following:

  - **Type**: `license`
  - **Trigger**: `incoming_event`
  - **Filter**: `author_type = agent`

- Click **Save**

##### b. Chat Deactivated Webhook

- Add another **Chat Webhooks** block
- Use the **same webhook URL** and **secret key**
- Set:

  - **Trigger**: `chat_deactivated`
  - **Type**: `license`

- Click **Save**

##### c. Chat Transferred Webhook

- Add one more **Chat Webhooks** block
- Use the **same webhook URL** and **secret key**
- Set:

  - **Trigger**: `chat_transferred`
  - **Type**: `license`

- Click **Save**

#### 7. Finalize App Setup

##### a. Add an Icon

- Go to the **Listing Details** section
- Upload a **random icon** for your app (any image will work)

##### b. Install the App

- Go to the **Private Installation** tab
- Click **"Install App"**

### Summary of Required Botpress Config

- **Client ID**: From App Authorization block
- **Organization ID**: From Account Settings
- **Secret Key**: From webhook setup
- **Agent Token**: From Personal Access Tokens (Base64 encoded)
- **Group ID**: From LiveChat Groups settings
- **Webhook URL**: Provided by Botpress
- **Scopes**: `chats.conversation--all:rw`
- **Redirect URI**: Must include your Botpress webhook URL in the App Auth block

## Usage

1. Configure the integration with your LiveChat credentials
2. Start a chat session using the `startHitl` action
3. Messages from the bot will appear in LiveChat
4. Agent responses in LiveChat will be sent back to the bot
5. All HITL conversations will be automatically routed to the specified group

## Events

The integration handles the following LiveChat events:

- `incoming_event`: New messages from agents
- `chat_deactivated`: Chat session ended
- `chat_transferred`: Chat transferred to another agent

## Security

- Webhook verification using a secret key
- OAuth2 authentication for API calls
- Personal agent token authentication
- Secure token management

## Support

For support, please contact the Botpress team or refer to the [LiveChat API documentation](https://developers.livechat.com/).
