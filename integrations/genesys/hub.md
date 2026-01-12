# Genesys Cloud HITL Integration

This integration enables Human-In-The-Loop (HITL) functionality for Botpress using Genesys Cloud's Open Message API. It allows seamless handoff of conversations from your bot to human agents in Genesys Cloud.

## Features

- **OAuth2 Authentication**: Secure authentication using Genesys Cloud OAuth2 client credentials
- **Bidirectional Messaging**: Send and receive messages between Botpress and Genesys Cloud
- **HITL Support**: Full support for starting and managing human agent conversations
- **Automatic Conversation Management**: Automatically creates and links conversations between Botpress and Genesys

## Prerequisites

Before using this integration, you need:

1. A Genesys Cloud account with administrator access
2. An Open Message integration configured in Genesys Cloud
3. OAuth2 Client Credentials (Client ID and Client Secret)
4. Your Genesys Cloud region domain

## Configuration

### 1. Setting up Genesys Cloud

1. Log in to your Genesys Cloud admin console
2. Navigate to **Admin** > **Integrations**
3. Click **+Integrations** and search for "Open Message"
4. Create a new Open Message integration and note the **Integration ID**

### 2. Creating OAuth2 Credentials

1. Navigate to **Admin** > **OAuth** > **Client Credentials**
2. Click **Add Client**
3. Enter a name for your client
4. Select the appropriate roles (at minimum: `messaging` and `conversations`)
5. Click **Save** and note the **Client ID** and **Client Secret**

### 3. Configuring the Botpress Integration

When setting up the integration in Botpress, provide the following information:

- **Client ID**: Your Genesys OAuth2 Client ID
- **Client Secret**: Your Genesys OAuth2 Client Secret
- **Region Domain**: Your Genesys region domain - use the **full domain** (e.g., `mypurecloud.com`, `mec1.pure.cloud`, `mypurecloud.ie`)

**Important Notes:**

- Use the full domain name, not just the region code (e.g., use `mec1.pure.cloud`, not `mec1`)
- The Integration ID is pre-configured in the integration code and does not need to be provided during setup

## Usage

### Starting a HITL Session

To start a HITL session and escalate a conversation to a human agent:

```javascript
// First, create a user
const { userId } = await actions.createUser({
  name: 'John Doe',
  email: 'john.doe@example.com',
  pictureUrl: 'https://example.com/avatar.jpg',
})

// Then start the HITL session
const { conversationId } = await actions.startHitl({
  userId: userId,
  title: 'Customer needs help with billing',
  description: 'Customer has questions about their recent invoice',
})
```

### Stopping a HITL Session

```javascript
await actions.stopHitl({
  conversationId: conversationId,
})
```

## Webhook Configuration

After deploying your integration, you'll receive a webhook URL from Botpress. Configure this webhook URL in your Genesys Open Message integration settings to receive incoming messages from agents.

## Message Flow

### Outbound (Bot → Genesys)

1. Bot sends a message through the HITL channel
2. Integration sends the message to Genesys using the Open Message API
3. Message appears in the agent's Genesys workspace

### Inbound (Genesys → Bot)

1. Agent sends a message in Genesys
2. Genesys sends webhook notification to Botpress
3. Integration processes the message and creates it in the Botpress conversation
4. Message is delivered to the user through the original channel

## API Endpoints Used

This integration uses the following Genesys Cloud APIs:

- **OAuth Token**: `POST https://login.{regionDomain}/oauth/token`
  - Used for obtaining OAuth2 access tokens
- **Send Message**: `POST https://api.{regionDomain}/api/v2/conversations/messages/{integrationId}/inbound/open/message`
  - Used for sending messages to Genesys Cloud

## Supported Message Types

Currently, this integration supports:

- ✅ Text messages

The following message types are not yet implemented but can be added:

- ❌ Images
- ❌ Audio
- ❌ Video
- ❌ Files

## Troubleshooting

### Authentication Errors

- Verify your Client ID and Client Secret are correct
- Ensure your OAuth client has the necessary roles (`messaging`, `conversations`)
- Check that your region domain is correct

### Messages Not Sending

- Verify the Integration ID is correct
- Check that the Open Message integration is active in Genesys
- Review the Botpress logs for detailed error messages

### Messages Not Receiving

- Verify the webhook URL is correctly configured in Genesys
- Ensure your Genesys account can reach the Botpress webhook URL
- Check firewall rules and network connectivity

## Region Domains

Common Genesys Cloud region domains:

**Americas:**

- US East: `mypurecloud.com`
- US East 2 (Government): `use2.us-gov-pure.cloud`
- US West: `usw2.pure.cloud`
- Canada: `cac1.pure.cloud`
- São Paulo: `sae1.pure.cloud`

**EMEA:**

- Dublin: `mypurecloud.ie`
- London: `euw2.pure.cloud`
- Frankfurt: `mypurecloud.de`
- Zurich: `euc1.pure.cloud`
- Middle East (UAE): `mec1.pure.cloud`

**Asia Pacific:**

- Mumbai: `aps1.pure.cloud`
- Seoul: `apne2.pure.cloud`
- Sydney: `mypurecloud.com.au`
- Tokyo: `mypurecloud.jp`
- Osaka: `apne3.pure.cloud`

> **Note:** Use the full domain (e.g., `mec1.pure.cloud`), not just the region code (e.g., `mec1`).

## Support

For issues related to:

- **Botpress Integration**: Contact Botpress support or create an issue in the repository
- **Genesys Cloud Configuration**: Consult [Genesys Cloud documentation](https://help.mypurecloud.com/) or contact Genesys support

## Version History

### 1.0.0 (Initial Release)

- OAuth2 authentication
- Text message support
- HITL session management
- Bidirectional message flow
