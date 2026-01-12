# Genesys Cloud HITL Integration

A Human-In-The-Loop (HITL) integration for Botpress that connects with Genesys Cloud Open Message API.

## Project Structure

```
genesys/
├── bp_modules/hitl/          # HITL interface module from Botpress
├── src/
│   ├── actions/              # HITL actions implementation
│   │   ├── hitl.ts          # startHitl, stopHitl, createUser
│   │   └── index.ts
│   ├── channels.ts          # HITL channel message handlers
│   ├── client.ts            # Genesys API client with OAuth2
│   ├── definitions/         # Integration schemas and types
│   │   ├── channels.ts
│   │   ├── events.ts
│   │   ├── genesys-schemas.ts  # Genesys-specific schemas
│   │   ├── index.ts
│   │   └── schemas.ts          # Configuration schema
│   ├── events/              # (Empty - for future event handlers)
│   ├── misc/
│   │   └── types.ts         # TypeScript helper types
│   ├── setup/               # Integration lifecycle handlers
│   │   ├── handler.ts       # Webhook handler for incoming messages
│   │   ├── index.ts
│   │   ├── register.ts      # Registration handler
│   │   └── unregister.ts    # Unregistration handler
│   └── index.ts             # Main integration export
├── integration.definition.ts # Integration definition with HITL extension
├── hub.md                    # User-facing documentation
├── icon.svg                  # Integration icon
├── package.json
└── tsconfig.json
```

## Key Features

1. **OAuth2 Authentication**: Automatically handles token acquisition and refresh
2. **Message Handling**: Bidirectional message flow between Botpress and Genesys
3. **User Management**: Creates and manages users with Genesys external IDs
4. **Conversation Management**: Links Botpress conversations with Genesys Open Message conversations
5. **HITL Actions**: Full support for starting/stopping HITL sessions

## Development Commands

```bash
# Install dependencies
pnpm install

# Generate types
pnpm run gen

# Type check
pnpm run check:type

# Deploy to Botpress
pnpm run deploy
```

## API Integration

### Authentication

- **Endpoint**: `POST https://login.{regionDomain}/oauth/token`
- **Method**: OAuth2 Client Credentials
- **Token Caching**: Access tokens are cached with automatic refresh

### Send Message

- **Endpoint**: `POST https://api.{regionDomain}/api/v2/conversations/messages/{integrationId}/inbound/open/message`
- **Authentication**: Bearer token
- **Payload**: Includes channel metadata, user info, and message text

## Configuration Parameters

| Parameter     | Description                  | Example           | Location              |
| ------------- | ---------------------------- | ----------------- | --------------------- |
| clientId      | Genesys OAuth2 Client ID     | `abc123...`       | User Configuration    |
| clientSecret  | Genesys OAuth2 Client Secret | `xyz789...`       | User Configuration    |
| regionDomain  | Genesys region domain (full) | `mec1.pure.cloud` | User Configuration    |
| integrationId | Open Message Integration ID  | `uuid-format-id`  | `src/constants.ts` ✨ |

**Note:** For `regionDomain`, use the full domain (e.g., `mec1.pure.cloud`), not just the region code (e.g., `mec1`).

## Testing

Before deployment, ensure:

1. Valid OAuth2 credentials
2. Open Message integration is active in Genesys
3. Webhook URL is configured in Genesys to point to Botpress
4. Network connectivity between Genesys and Botpress

## Notes

- The integration uses "Opaque" idType for external user IDs
- Message IDs are auto-generated with timestamp and random string
- Currently supports text messages only (images, audio, video, files can be added)
- Genesys doesn't provide an API to end conversations, so stopHitl is a no-op
