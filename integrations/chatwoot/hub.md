# Chatwoot HITL

Human-in-the-Loop integration with Chatwoot. Hand off conversations from your bot to human agents.

## Setup

1. **API Access Token** - Profile Settings → Access Token

2. **Inbox ID** - Settings → Inboxes → Create API inbox → Get ID from URL:
   ```
   https://app.chatwoot.com/app/accounts/1/settings/inboxes/12345
                                                          ^^^^^
   ```

3. **Webhook** - Settings → Integrations → Webhooks → Add your Botpress webhook URL → Select `message_created`

## Usage

1. `createUser` - Create contact (requires email)
2. `startHitl` - Start handoff to human agent
3. `stopHitl` - End handoff, resolve conversation
